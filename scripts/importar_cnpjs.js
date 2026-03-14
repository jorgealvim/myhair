#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const CNAES_ALVO = new Set([
  '9602501',
  '9602502',
]);

const PALAVRAS_CHAVE = [
  'salao',
  'salão',
  'barbearia',
  'beleza',
  'estetica',
  'estética',
  'manicure',
  'pedicure',
  'cabeleireiro',
  'cabeleireira',
];

function parseArgs(argv) {
  const args = {};

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function printHelp() {
  console.log([
    'Uso:',
    '  node scripts/importar_cnpjs.js --input arquivo.csv --output saloes-jf.json',
    '',
    'Opcoes:',
    '  --input       Arquivo de entrada (.csv, .json, .jsonl, .ndjson)',
    '  --output      Arquivo JSON de saida',
    '  --cidade      Cidade alvo. Padrao: Juiz de Fora',
    '  --uf          UF alvo. Padrao: MG',
    '  --limite      Limita quantidade final exportada',
    '  --enriquecer  Consulta dados detalhados via BrasilAPI para cada CNPJ filtrado',
    '  --help        Mostra esta ajuda',
  ].join('\n'));
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCnpj(value) {
  const digits = digitsOnly(value).padStart(14, '0').slice(-14);
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function buildSystemId(cnpj) {
  const digits = digitsOnly(cnpj);
  return `PJ-${digits.slice(0, 4)}-${digits.slice(-4)}`;
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function detectCsvDelimiter(headerLine) {
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ';' : ',';
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = detectCsvDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map((header) => normalizeText(header));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    return row;
  });
}

function parseJson(content) {
  const parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data;
  }

  return [parsed];
}

function parseJsonLines(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function loadRows(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const content = fs.readFileSync(inputPath, 'utf8');

  if (ext === '.json') {
    return parseJson(content);
  }

  if (ext === '.jsonl' || ext === '.ndjson') {
    return parseJsonLines(content);
  }

  return parseCsv(content);
}

function getNestedValue(source, pathKey) {
  if (!source || typeof source !== 'object' || !pathKey) {
    return undefined;
  }

  const segments = String(pathKey).split('.').filter(Boolean);
  let current = source;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
      continue;
    }

    const matchKey = Object.keys(current).find((key) => normalizeText(key) === normalizeText(segment));
    if (!matchKey) {
      return undefined;
    }
    current = current[matchKey];
  }

  return current;
}

function pickFirst(row, keys) {
  for (const key of keys) {
    const value = getNestedValue(row, key);
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
      continue;
    }

    return value;
  }

  return '';
}

function extractPhoneParts(row) {
  const ddd = digitsOnly(pickFirst(row, [
    'ddd_telefone_1',
    'telefone.ddd',
    'telefone[0].ddd',
  ]));

  const telefoneLista = pickFirst(row, ['telefone']);
  if (Array.isArray(telefoneLista) && telefoneLista.length) {
    const primeiro = telefoneLista[0] || {};
    const dddLista = digitsOnly(primeiro.ddd || '');
    const numeroLista = digitsOnly(primeiro.numero || '');
    return {
      ddd: ddd || dddLista,
      numero: numeroLista,
    };
  }

  const numero = digitsOnly(pickFirst(row, [
    'telefone',
    'whatsapp',
    'telefone1',
    'ddd_telefone_1',
    'endereco.telefone',
  ]));

  return { ddd, numero };
}

function parseCidadeUf(value) {
  const texto = String(value || '').trim();
  if (!texto) {
    return { cidade: '', uf: '' };
  }

  if (texto.includes('/')) {
    const partes = texto.split('/').map((item) => item.trim()).filter(Boolean);
    return {
      cidade: partes[0] || '',
      uf: (partes[1] || '').toUpperCase(),
    };
  }

  return { cidade: texto, uf: '' };
}

function extractCnpj(row) {
  const direct = pickFirst(row, [
    'cnpj',
    'ni',
    'cnpj_completo',
    'numero_inscricao',
    'estabelecimento_cnpj',
    'estabelecimento_numerocnpj',
  ]);

  if (direct) {
    return digitsOnly(direct);
  }

  const basico = digitsOnly(pickFirst(row, ['cnpj_basico', 'basico']));
  const ordem = digitsOnly(pickFirst(row, ['cnpj_ordem', 'ordem'])).padStart(4, '0');
  const dv = digitsOnly(pickFirst(row, ['cnpj_dv', 'dv'])).padStart(2, '0');

  if (basico) {
    return `${basico}${ordem}${dv}`;
  }

  return '';
}

function extractCity(row) {
  const fromAddress = pickFirst(row, [
    'endereco.municipio.descricao',
    'municipio.descricao',
    'municipio',
    'cidade',
    'descricao_municipio',
    'nome_municipio',
    'estabelecimento_municipio',
    'estabelecimento_cidade_exterior',
  ]);

  const parsed = parseCidadeUf(fromAddress);
  if (parsed.cidade) {
    return parsed.cidade;
  }

  const jurisdicao = pickFirst(row, ['municipioJurisdicao.descricao']);
  return parseCidadeUf(jurisdicao).cidade;
}

function extractUf(row) {
  const ufDireta = pickFirst(row, ['uf', 'estado', 'sigla_uf', 'estabelecimento_uf']);
  if (String(ufDireta || '').trim()) {
    return ufDireta;
  }

  const cidadeUf = parseCidadeUf(pickFirst(row, ['cidade', 'municipioJurisdicao.descricao', 'endereco.municipio.descricao']));
  return cidadeUf.uf;
}

function extractName(row) {
  return pickFirst(row, [
    'nomeEmpresarial',
    'razao_social',
    'nome_empresarial',
    'nome',
  ]);
}

function extractFantasy(row) {
  return pickFirst(row, [
    'nomeFantasia',
    'nome_fantasia',
    'fantasia',
    'estabelecimento_nomefantasia',
  ]);
}

function extractCnaes(row) {
  const principalReceita = digitsOnly(pickFirst(row, ['cnaePrincipal.codigo']));
  const secundariasReceita = pickFirst(row, ['cnaeSecundarias']);
  const secundariasReceitaCodigos = Array.isArray(secundariasReceita)
    ? secundariasReceita.map((item) => digitsOnly(item?.codigo || '')).filter(Boolean)
    : [];

  const principal = digitsOnly(pickFirst(row, [
    'cnaePrincipal.codigo',
    'cnae_fiscal_principal',
    'codigo_cnae_principal',
    'cnae_principal',
    'estabelecimento_cnae_fiscal_principal',
  ]));

  const secondaryRaw = pickFirst(row, [
    'cnae_fiscal_secundaria',
    'cnae_fiscal_secundario',
    'cnaes_secundarios',
    'cnae_secundaria',
    'estabelecimento_cnae_fiscal_secundaria',
  ]);

  const secundarias = String(secondaryRaw || '')
    .split(/[;,|]/)
    .map((value) => digitsOnly(value))
    .filter(Boolean);

  return [principalReceita, principal, ...secundariasReceitaCodigos, ...secundarias].filter(Boolean);
}

function isBeautyBusiness(row, city, uf) {
  const rowCity = normalizeText(extractCity(row));
  const rowUf = normalizeText(extractUf(row));
  const normalizedCity = normalizeText(city);
  const normalizedUf = normalizeText(uf);

  if (rowCity !== normalizedCity) {
    return false;
  }

  if (normalizedUf && rowUf && rowUf !== normalizedUf) {
    return false;
  }

  const cnaes = extractCnaes(row);
  if (cnaes.some((cnae) => CNAES_ALVO.has(cnae))) {
    return true;
  }

  const searchText = normalizeText(`${extractName(row)} ${extractFantasy(row)}`);
  return PALAVRAS_CHAVE.some((keyword) => searchText.includes(normalizeText(keyword)));
}

function inferServices(source) {
  const text = normalizeText(JSON.stringify(source));
  const services = new Set();

  if (text.includes('barbear')) services.add('barba');
  if (text.includes('manicure') || text.includes('pedicure')) {
    services.add('mao');
    services.add('pe');
  }
  if (text.includes('estet')) services.add('maquiagem');
  if (text.includes('cabel') || text.includes('salao')) services.add('cabelo');

  if (services.size === 0) {
    services.add('cabelo');
  }

  return Array.from(services);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];

      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode}: ${body}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function enrichCompany(entry) {
  const details = await requestJson(`https://brasilapi.com.br/api/cnpj/v1/${entry.cnpj}`);

  return {
    ...entry,
    razao_social: details.razao_social || entry.razao_social,
    nome_fantasia: details.nome_fantasia || entry.nome_fantasia,
    email: details.email || entry.email,
    ddd_telefone_1: details.ddd_telefone_1 || entry.ddd_telefone_1,
    ddd_telefone_2: details.ddd_telefone_2 || entry.ddd_telefone_2,
    logradouro: details.logradouro || entry.logradouro,
    numero: details.numero || entry.numero,
    complemento: details.complemento || entry.complemento,
    bairro: details.bairro || entry.bairro,
    cep: details.cep || entry.cep,
    cnae_fiscal_principal: details.cnae_fiscal_principal || entry.cnae_fiscal_principal,
    cnae_fiscal_secundaria: details.cnae_fiscal_secundaria || entry.cnae_fiscal_secundaria,
    descricao_situacao_cadastral: details.descricao_situacao_cadastral || entry.descricao_situacao_cadastral,
    natureza_juridica: details.natureza_juridica || entry.natureza_juridica,
    raw_api: details,
  };
}

function mapToMyHair(entry, city, uf) {
  const telefones = extractPhoneParts(entry);
  const ddd = digitsOnly(entry.ddd_telefone_1 || entry.ddd || telefones.ddd || '');
  const telefoneBase = digitsOnly(entry.telefone || entry.whatsapp || entry.telefone1 || entry.ddd_telefone_1 || telefones.numero || '');
  const telefone = telefoneBase.startsWith(ddd) || !ddd ? telefoneBase : `${ddd}${telefoneBase}`;
  const fantasia = entry.nome_fantasia || entry.nomeFantasia || entry.fantasia || entry.razao_social || entry.nomeEmpresarial || entry.nome || '';
  const razao = entry.razao_social || entry.nomeEmpresarial || entry.nome || fantasia;
  const cnpj = digitsOnly(entry.cnpj);
  const rua = entry.logradouro || entry.endereco?.logradouro || entry.rua || '';
  const numero = entry.numero || entry.endereco?.numero || '';

  return {
    idSistema: buildSystemId(cnpj),
    tipoConta: 'PJ',
    origemImportacao: 'base-publica-cnpj',
    importadoEm: new Date().toISOString(),
    documento: formatCnpj(cnpj),
    cnpj,
    nome: razao,
    fantasia: fantasia,
    email: entry.email || entry.correioEletronico || '',
    whats: telefone,
    servicosOferecidos: inferServices(entry),
    produtosVenda: [],
    locaisPrestacao: ['empresa'],
    formasRetirada: ['empresa'],
    cep: digitsOnly(entry.cep || entry.endereco?.cep || ''),
    rua,
    numero,
    complemento: entry.complemento || entry.endereco?.complemento || '',
    bairro: entry.bairro || entry.endereco?.bairro || '',
    cidade: `${city}/${uf}`,
    banco: '',
    agencia: '',
    conta: '',
    dataRegistro: new Date().toISOString(),
    metadataImportacao: {
      fonteDocumento: 'cnpj-publico',
      descricaoSituacao: entry.descricao_situacao_cadastral || '',
      cnaePrincipal: digitsOnly(entry.cnae_fiscal_principal || ''),
      naturezaJuridica: entry.natureza_juridica || '',
    },
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input || !args.output) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const city = args.cidade || 'Juiz de Fora';
  const uf = args.uf || 'MG';
  const limit = args.limite ? Number(args.limite) : null;

  const rows = loadRows(path.resolve(args.input));
  const filtered = rows
    .filter((row) => isBeautyBusiness(row, city, uf))
    .map((row) => ({
      ...row,
      cnpj: extractCnpj(row),
      razao_social: extractName(row),
      nome_fantasia: extractFantasy(row),
      cnae_fiscal_principal: extractCnaes(row)[0] || '',
      cidade: extractCity(row),
      uf: extractUf(row),
      logradouro: pickFirst(row, ['logradouro', 'endereco.logradouro', 'estabelecimento_tipo_logradouro']),
      numero: pickFirst(row, ['numero', 'endereco.numero', 'estabelecimento_numero']),
      complemento: pickFirst(row, ['complemento', 'endereco.complemento', 'estabelecimento_complemento']),
      bairro: pickFirst(row, ['bairro', 'endereco.bairro', 'estabelecimento_bairro']),
      cep: pickFirst(row, ['cep', 'endereco.cep', 'estabelecimento_cep']),
      email: pickFirst(row, ['email', 'correioEletronico', 'correio_eletronico', 'estabelecimento_correio_eletronico']),
      ddd_telefone_1: extractPhoneParts(row).ddd || pickFirst(row, ['ddd_telefone_1', 'telefone1', 'estabelecimento_ddd1']),
      telefone: extractPhoneParts(row).numero || pickFirst(row, ['telefone', 'telefone1']),
    }))
    .filter((row) => row.cnpj.length === 14);

  const unique = Array.from(new Map(filtered.map((row) => [row.cnpj, row])).values());
  const selected = limit ? unique.slice(0, limit) : unique;

  let enriched = selected;
  if (args.enriquecer) {
    enriched = [];
    for (const company of selected) {
      try {
        enriched.push(await enrichCompany(company));
      } catch (error) {
        enriched.push({
          ...company,
          erro_enriquecimento: error.message,
        });
      }
      await sleep(250);
    }
  }

  const output = {
    cidade: city,
    uf,
    totalEncontrado: unique.length,
    totalExportado: enriched.length,
    geradoEm: new Date().toISOString(),
    empresas: enriched.map((entry) => mapToMyHair(entry, city, uf)),
    bruto: enriched,
  };

  const outputPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

  console.log(`Exportado com sucesso: ${outputPath}`);
  console.log(`Empresas filtradas: ${unique.length}`);
  console.log(`Empresas exportadas: ${enriched.length}`);
}

main().catch((error) => {
  console.error('Falha na importacao:', error.message);
  process.exit(1);
});