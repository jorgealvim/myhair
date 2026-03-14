#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
    '  node scripts/importar_firestore.js --input exports\\saloes-jf.json --service-account chave.json',
    '',
    'Opcoes:',
    '  --input            JSON gerado pelo importar_cnpjs.js',
    '  --service-account  Caminho do arquivo JSON da conta de servico do Firebase',
    '  --collection       Nome da colecao de destino. Padrao: usuarios',
    '  --modo             merge | overwrite | skip-existing. Padrao: merge',
    '  --limite           Limita quantidade de registros importados',
    '  --dry-run          Simula a importacao sem gravar no Firestore',
    '  --help             Mostra esta ajuda',
  ].join('\n'));
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function loadPayload(inputPath) {
  const content = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(content);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.empresas)) {
    return parsed.empresas;
  }

  throw new Error('Arquivo de entrada invalido: esperado array ou campo empresas.');
}

function buildDocId(record) {
  const cnpj = digitsOnly(record.cnpj || record.documento || '');
  if (cnpj) {
    return `cnpj_${cnpj}`;
  }

  const fallback = digitsOnly(record.documento || '');
  if (fallback) {
    return `doc_${fallback}`;
  }

  const nome = String(record.nome || record.fantasia || 'registro')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `nome_${nome || Date.now()}`;
}

async function createFirestore(serviceAccountPath) {
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.firestore();
}

async function importRecords({
  records,
  collectionName,
  mode,
  limit,
  dryRun,
  serviceAccountPath,
}) {
  const selected = limit ? records.slice(0, Number(limit)) : records;

  if (dryRun) {
    console.log(`Dry run: ${selected.length} registros seriam importados para ${collectionName}.`);
    selected.slice(0, 5).forEach((record, index) => {
      console.log(`${index + 1}. ${buildDocId(record)} -> ${record.fantasia || record.nome || 'Sem nome'}`);
    });
    return;
  }

  const db = await createFirestore(serviceAccountPath);
  let imported = 0;
  let skipped = 0;

  for (const record of selected) {
    const docId = buildDocId(record);
    const ref = db.collection(collectionName).doc(docId);

    if (mode === 'skip-existing') {
      const snapshot = await ref.get();
      if (snapshot.exists) {
        skipped += 1;
        continue;
      }
      await ref.set(record);
      imported += 1;
      continue;
    }

    if (mode === 'overwrite') {
      await ref.set(record);
      imported += 1;
      continue;
    }

    await ref.set(record, { merge: true });
    imported += 1;
  }

  console.log(`Importacao concluida.`);
  console.log(`Colecao: ${collectionName}`);
  console.log(`Importados: ${imported}`);
  console.log(`Ignorados: ${skipped}`);
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help || !args.input) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);
  const collectionName = args.collection || 'usuarios';
  const mode = args.modo || 'merge';
  const validModes = new Set(['merge', 'overwrite', 'skip-existing']);

  if (!validModes.has(mode)) {
    throw new Error(`Modo invalido: ${mode}`);
  }

  if (!args['dry-run'] && !args['service-account']) {
    throw new Error('Informe --service-account para gravar no Firestore, ou use --dry-run para simular.');
  }

  const records = loadPayload(inputPath);

  await importRecords({
    records,
    collectionName,
    mode,
    limit: args.limite,
    dryRun: Boolean(args['dry-run']),
    serviceAccountPath: args['service-account'] ? path.resolve(args['service-account']) : null,
  });
}

main().catch((error) => {
  console.error('Falha na importacao para Firestore:', error.message);
  process.exit(1);
});