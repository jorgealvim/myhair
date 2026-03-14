#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {};

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    i += 1;
  }

  return args;
}

function printHelp() {
  console.log([
    'Uso:',
    '  node scripts/validar_receita_json.js --input dados/receita-jf.json',
    '',
    'Opcoes:',
    '  --input   Caminho do JSON da Receita',
    '  --help    Mostra esta ajuda',
  ].join('\n'));
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function toRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.data)) return parsed.data;
  if (parsed && Array.isArray(parsed.empresas)) return parsed.empresas;
  return [parsed];
}

function getCity(row) {
  return (
    row?.endereco?.municipio?.descricao
    || row?.municipioJurisdicao?.descricao
    || row?.cidade
    || ''
  );
}

function getCnpj(row) {
  return digitsOnly(row?.ni || row?.cnpj || '');
}

function getCnae(row) {
  return digitsOnly(row?.cnaePrincipal?.codigo || row?.cnae_fiscal_principal || '');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);
  const content = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(content);
  const rows = toRows(parsed);

  const total = rows.length;
  let withCnpj = 0;
  let withName = 0;
  let withCity = 0;
  let withCnae = 0;
  let juizDeFora = 0;

  rows.forEach((row) => {
    if (getCnpj(row).length === 14) withCnpj += 1;
    if (String(row?.nomeEmpresarial || row?.nomeFantasia || row?.razao_social || '').trim()) withName += 1;
    const city = getCity(row);
    if (String(city).trim()) withCity += 1;
    if (getCnae(row)) withCnae += 1;
    if (normalizeText(city).includes(normalizeText('Juiz de Fora'))) juizDeFora += 1;
  });

  console.log('Validacao do JSON da Receita');
  console.log(`Arquivo: ${inputPath}`);
  console.log(`Total de registros: ${total}`);
  console.log(`Com CNPJ (14 digitos): ${withCnpj}`);
  console.log(`Com nome empresarial/fantasia: ${withName}`);
  console.log(`Com cidade preenchida: ${withCity}`);
  console.log(`Com CNAE principal: ${withCnae}`);
  console.log(`Mencao a Juiz de Fora: ${juizDeFora}`);

  if (total === 0 || withCnpj === 0 || withCity === 0) {
    console.log('Resultado: arquivo insuficiente para filtro confiavel.');
    process.exit(2);
  }

  console.log('Resultado: estrutura valida para tentar filtragem.');
}

try {
  main();
} catch (error) {
  console.error('Falha ao validar JSON:', error.message);
  process.exit(1);
}
