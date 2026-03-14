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
    '  npm run popular:teste -- --service-account caminho\\chave.json',
    '',
    'Opcoes:',
    '  --service-account  Arquivo JSON da conta de servico do Firebase',
    '  --senha            Senha padrao das contas demo. Padrao: Teste@123',
    '  --help             Mostra esta ajuda',
  ].join('\n'));
}

function sanitizarId(valor) {
  return String(valor || '').replace(/[^a-zA-Z0-9_-]/g, '_');
}

function comporFavoritoId(deId, paraId) {
  return `fav_${sanitizarId(deId)}__${sanitizarId(paraId)}`;
}

function comporAvaliacaoId(deTipo, deId, paraTipo, paraId) {
  return `aval_${sanitizarId(deTipo)}_${sanitizarId(deId)}__${sanitizarId(paraTipo)}_${sanitizarId(paraId)}`;
}

function addDays(baseDate, offset) {
  const date = new Date(baseDate.getTime());
  date.setDate(date.getDate() + offset);
  return date;
}

function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slotDisponivel() {
  return {
    disponivel: true,
    clienteNome: '',
    clienteId: '',
    status: 'disponivel',
  };
}

function slotOcupado(clienteId, clienteNome) {
  return {
    disponivel: false,
    clienteNome,
    clienteId,
    status: 'confirmado',
  };
}

function montarAgenda(clienteAceito) {
  const hoje = new Date();
  const agenda = {};

  for (let offset = 1; offset <= 5; offset += 1) {
    const dia = toISODate(addDays(hoje, offset));
    agenda[dia] = {
      '09:00': slotDisponivel(),
      '09:30': slotDisponivel(),
      '10:00': offset === 1 ? slotOcupado(clienteAceito.uid, clienteAceito.nome) : slotDisponivel(),
      '10:30': slotDisponivel(),
      '14:00': slotDisponivel(),
      '14:30': slotDisponivel(),
      '15:00': slotDisponivel(),
    };
  }

  return agenda;
}

function getDemoData() {
  const clientes = [
    {
      uid: 'demo_cliente_1',
      nome: 'Ana Teste',
      email: 'cliente1@myhair.test',
      cpf: '111.111.111-11',
      whatsapp: '(32) 99999-1101',
      endereco: 'Rua das Flores',
      numero: '101',
      bairro: 'Centro',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36010-000',
    },
    {
      uid: 'demo_cliente_2',
      nome: 'Bruno Teste',
      email: 'cliente2@myhair.test',
      cpf: '222.222.222-22',
      whatsapp: '(32) 99999-2202',
      endereco: 'Avenida Rio Branco',
      numero: '202',
      bairro: 'Bom Pastor',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36020-000',
    },
    {
      uid: 'demo_cliente_3',
      nome: 'Carla Teste',
      email: 'cliente3@myhair.test',
      cpf: '333.333.333-33',
      whatsapp: '(32) 99999-3303',
      endereco: 'Rua Halfeld',
      numero: '303',
      bairro: 'Sao Mateus',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36025-000',
    },
  ];

  const saloes = [
    {
      uid: 'demo_salao_1',
      idSistema: 'MH-DEMO-SALAO-01',
      tipoConta: 'PJ',
      nome: 'Studio Aurora Beleza Ltda',
      fantasia: 'Studio Aurora',
      email: 'salao1@myhair.test',
      documento: '11.111.111/0001-01',
      whatsapp: '(32) 98888-1001',
      endereco: 'Rua Mister Moore',
      numero: '45',
      bairro: 'Centro',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36013-000',
      horarioAbertura: '08:00',
      horarioFechamento: '18:00',
      servicosOferecidos: ['cabelo', 'maquiagem', 'sobrancelha'],
      tabelaServicos: [
        { nome: 'Corte feminino', preco: '65,00', tempo: '1h' },
        { nome: 'Escova', preco: '45,00', tempo: '45min' },
        { nome: 'Maquiagem social', preco: '90,00', tempo: '1h30' },
      ],
      produtosVenda: ['Shampoo premium', 'Mascara nutritiva'],
      tabelaProdutos: [
        { nome: 'Shampoo premium', estoque: '12', preco: '39,90' },
        { nome: 'Mascara nutritiva', estoque: '8', preco: '54,90' },
      ],
      locaisPrestacao: ['empresa', 'domicilio'],
      formasRetirada: ['empresa', 'entrega'],
      boasVindas: 'Bem-vindo ao Studio Aurora. Aqui voce consegue testar agenda, servicos e compras.',
    },
    {
      uid: 'demo_salao_2',
      idSistema: 'MH-DEMO-SALAO-02',
      tipoConta: 'PF',
      nome: 'Marina Teste',
      fantasia: 'Marina Nails',
      email: 'salao2@myhair.test',
      documento: '222.222.222-22',
      whatsapp: '(32) 98888-2002',
      endereco: 'Rua Padre Cafe',
      numero: '88',
      bairro: 'Sao Pedro',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36037-000',
      horarioAbertura: '09:00',
      horarioFechamento: '19:00',
      servicosOferecidos: ['mao', 'pe', 'sobrancelha'],
      tabelaServicos: [
        { nome: 'Manicure', preco: '30,00', tempo: '40min' },
        { nome: 'Pedicure', preco: '35,00', tempo: '50min' },
        { nome: 'Spa dos pes', preco: '55,00', tempo: '1h' },
      ],
      produtosVenda: ['Base fortalecedora'],
      tabelaProdutos: [
        { nome: 'Base fortalecedora', estoque: '15', preco: '19,90' },
      ],
      locaisPrestacao: ['empresa'],
      formasRetirada: ['empresa', 'transportadora'],
      boasVindas: 'Perfil demo para testar atendimentos na empresa e aprovacao de solicitacoes.',
    },
    {
      uid: 'demo_salao_3',
      idSistema: 'MH-DEMO-SALAO-03',
      tipoConta: 'PJ',
      nome: 'Casa Zen Estetica Ltda',
      fantasia: 'Casa Zen',
      email: 'salao3@myhair.test',
      documento: '33.333.333/0001-03',
      whatsapp: '(32) 98888-3003',
      endereco: 'Avenida Itamar Franco',
      numero: '500',
      bairro: 'Cascatinha',
      cidade: 'Juiz de Fora',
      uf: 'MG',
      cep: '36033-000',
      horarioAbertura: '10:00',
      horarioFechamento: '20:00',
      servicosOferecidos: ['massagem', 'depilacao', 'cabelo'],
      tabelaServicos: [
        { nome: 'Massagem relaxante', preco: '120,00', tempo: '1h' },
        { nome: 'Depilacao parcial', preco: '50,00', tempo: '30min' },
      ],
      produtosVenda: ['Oleo corporal', 'Creme hidratante'],
      tabelaProdutos: [
        { nome: 'Oleo corporal', estoque: '9', preco: '44,90' },
        { nome: 'Creme hidratante', estoque: '14', preco: '29,90' },
      ],
      locaisPrestacao: ['domicilio'],
      formasRetirada: ['entrega', 'transportadora'],
      boasVindas: 'Use este perfil para validar deslocamento e taxa por km.',
    },
  ];

  saloes[0].agenda = montarAgenda(clientes[0]);
  saloes[1].agenda = montarAgenda(clientes[1]);
  saloes[2].agenda = montarAgenda(clientes[2]);

  return { clientes, saloes };
}

async function initFirebase(serviceAccountPath) {
  const admin = require('firebase-admin');
  const absolutePath = path.resolve(serviceAccountPath);
  const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return {
    admin,
    auth: admin.auth(),
    db: admin.firestore(),
  };
}

async function upsertAuthUser(auth, data, password) {
  try {
    await auth.getUser(data.uid);
    await auth.updateUser(data.uid, {
      email: data.email,
      password,
      displayName: data.fantasia || data.nome,
      emailVerified: true,
      disabled: false,
    });
    return 'updated';
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      throw error;
    }

    await auth.createUser({
      uid: data.uid,
      email: data.email,
      password,
      displayName: data.fantasia || data.nome,
      emailVerified: true,
      disabled: false,
    });
    return 'created';
  }
}

async function gravarUsuarios(db, saloes, clientes) {
  for (const salao of saloes) {
    await db.collection('usuarios').doc(salao.uid).set({
      ...salao,
      dataRegistro: new Date().toISOString(),
    }, { merge: true });
  }

  for (const cliente of clientes) {
    await db.collection('clientes').doc(cliente.uid).set({
      ...cliente,
      tipoUsuario: 'CLIENTE',
      dataCadastro: new Date().toISOString(),
    }, { merge: true });
  }
}

async function gravarRelacionamentos(db, saloes, clientes) {
  const amanha = toISODate(addDays(new Date(), 1));
  const depois = toISODate(addDays(new Date(), 2));

  const favoritos = [
    {
      id: comporFavoritoId(`cliente_${clientes[0].uid}`, `salao_${saloes[0].idSistema}`),
      data: {
        deId: clientes[0].uid,
        deTipo: 'cliente',
        paraId: saloes[0].idSistema,
        paraTipo: 'salao',
        criadoEm: new Date().toISOString(),
      },
    },
    {
      id: comporFavoritoId(`salao_${saloes[1].idSistema}`, `cliente_${clientes[0].uid}`),
      data: {
        deId: saloes[1].idSistema,
        deTipo: 'salao',
        paraId: clientes[0].uid,
        paraTipo: 'cliente',
        criadoEm: new Date().toISOString(),
      },
    },
  ];

  const solicitacoesAgendamento = [
    {
      id: `sol_${sanitizarId(clientes[1].uid)}__${sanitizarId(saloes[0].idSistema)}__${amanha.replace(/-/g, '')}_0930`,
      data: {
        prestadorId: saloes[0].idSistema,
        prestadorNome: saloes[0].fantasia,
        clienteId: clientes[1].uid,
        clienteNome: clientes[1].nome,
        localPrestacao: 'empresa',
        carrinhoServicos: [
          { nome: 'Escova', precoUnitario: 45, tempo: '45min', quantidade: 1 },
        ],
        subtotalServicos: 45,
        taxaDeslocamento: 0,
        distanciaKm: 0,
        distanciaFonte: 'nao_aplicavel',
        valorTotal: 45,
        data: amanha,
        hora: '09:30',
        status: 'pendente',
        mensagemPrestador: 'Aguardando resposta do prestador.',
        criadoEm: new Date().toISOString(),
      },
    },
    {
      id: `sol_${sanitizarId(clientes[0].uid)}__${sanitizarId(saloes[1].idSistema)}__${amanha.replace(/-/g, '')}_1000`,
      data: {
        prestadorId: saloes[1].idSistema,
        prestadorNome: saloes[1].fantasia,
        clienteId: clientes[0].uid,
        clienteNome: clientes[0].nome,
        localPrestacao: 'empresa',
        carrinhoServicos: [
          { nome: 'Manicure', precoUnitario: 30, tempo: '40min', quantidade: 1 },
        ],
        subtotalServicos: 30,
        taxaDeslocamento: 0,
        distanciaKm: 0,
        distanciaFonte: 'nao_aplicavel',
        valorTotal: 30,
        data: amanha,
        hora: '10:00',
        status: 'aceito',
        mensagemPrestador: 'horario marcado com sucesso',
        criadoEm: new Date().toISOString(),
        respostaEm: new Date().toISOString(),
      },
    },
    {
      id: `sol_${sanitizarId(clientes[2].uid)}__${sanitizarId(saloes[2].idSistema)}__${depois.replace(/-/g, '')}_1400`,
      data: {
        prestadorId: saloes[2].idSistema,
        prestadorNome: saloes[2].fantasia,
        clienteId: clientes[2].uid,
        clienteNome: clientes[2].nome,
        localPrestacao: 'domicilio',
        carrinhoServicos: [
          { nome: 'Massagem relaxante', precoUnitario: 120, tempo: '1h', quantidade: 1 },
        ],
        subtotalServicos: 120,
        taxaDeslocamento: 28,
        distanciaKm: 7,
        distanciaFonte: 'google_maps',
        valorTotal: 148,
        data: depois,
        hora: '14:00',
        status: 'pendente',
        mensagemPrestador: 'Aguardando resposta do prestador.',
        criadoEm: new Date().toISOString(),
      },
    },
  ];

  const compras = [
    {
      id: `comp_${sanitizarId(clientes[0].uid)}__${sanitizarId(saloes[0].idSistema)}__demo1`,
      data: {
        idCompra: `comp_${sanitizarId(clientes[0].uid)}__${sanitizarId(saloes[0].idSistema)}__demo1`,
        prestadorId: saloes[0].idSistema,
        prestadorNome: saloes[0].fantasia,
        clienteId: clientes[0].uid,
        clienteNome: clientes[0].nome,
        retirada: 'entrega',
        retiradaLabel: 'Entrega',
        itens: [
          { nome: 'Shampoo premium', quantidade: 1, precoUnitario: 39.9, subtotal: 39.9 },
          { nome: 'Mascara nutritiva', quantidade: 1, precoUnitario: 54.9, subtotal: 54.9 },
        ],
        total: 94.8,
        status: 'pendente',
        criadoEm: new Date().toISOString(),
      },
    },
    {
      id: `comp_${sanitizarId(clientes[1].uid)}__${sanitizarId(saloes[1].idSistema)}__demo2`,
      data: {
        idCompra: `comp_${sanitizarId(clientes[1].uid)}__${sanitizarId(saloes[1].idSistema)}__demo2`,
        prestadorId: saloes[1].idSistema,
        prestadorNome: saloes[1].fantasia,
        clienteId: clientes[1].uid,
        clienteNome: clientes[1].nome,
        retirada: 'empresa',
        retiradaLabel: 'Na empresa',
        itens: [
          { nome: 'Base fortalecedora', quantidade: 2, precoUnitario: 19.9, subtotal: 39.8 },
        ],
        total: 39.8,
        status: 'aceito',
        criadoEm: new Date().toISOString(),
        respostaEm: new Date().toISOString(),
      },
    },
  ];

  const avaliacoes = [
    {
      id: comporAvaliacaoId('cliente', clientes[0].uid, 'salao', saloes[0].idSistema),
      data: {
        deId: clientes[0].uid,
        deTipo: 'cliente',
        paraId: saloes[0].idSistema,
        paraTipo: 'salao',
        nota: 5,
        atualizadoEm: new Date().toISOString(),
      },
    },
    {
      id: comporAvaliacaoId('cliente', clientes[1].uid, 'salao', saloes[0].idSistema),
      data: {
        deId: clientes[1].uid,
        deTipo: 'cliente',
        paraId: saloes[0].idSistema,
        paraTipo: 'salao',
        nota: 4,
        atualizadoEm: new Date().toISOString(),
      },
    },
    {
      id: comporAvaliacaoId('salao', saloes[1].idSistema, 'cliente', clientes[0].uid),
      data: {
        deId: saloes[1].idSistema,
        deTipo: 'salao',
        paraId: clientes[0].uid,
        paraTipo: 'cliente',
        nota: 5,
        atualizadoEm: new Date().toISOString(),
      },
    },
  ];

  for (const favorito of favoritos) {
    await db.collection('favoritos').doc(favorito.id).set(favorito.data, { merge: true });
  }

  for (const solicitacao of solicitacoesAgendamento) {
    await db.collection('solicitacoes_agendamento').doc(solicitacao.id).set(solicitacao.data, { merge: true });
  }

  for (const compra of compras) {
    await db.collection('solicitacoes_compra_produtos').doc(compra.id).set(compra.data, { merge: true });
  }

  for (const avaliacao of avaliacoes) {
    await db.collection('avaliacoes').doc(avaliacao.id).set(avaliacao.data, { merge: true });
  }
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.help || !args['service-account']) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  const senha = String(args.senha || 'Teste@123');
  const { auth, db } = await initFirebase(args['service-account']);
  const { clientes, saloes } = getDemoData();

  for (const salao of saloes) {
    const result = await upsertAuthUser(auth, salao, senha);
    console.log(`Salao ${salao.email}: ${result}`);
  }

  for (const cliente of clientes) {
    const result = await upsertAuthUser(auth, cliente, senha);
    console.log(`Cliente ${cliente.email}: ${result}`);
  }

  await gravarUsuarios(db, saloes, clientes);
  await gravarRelacionamentos(db, saloes, clientes);

  console.log('');
  console.log('Massa de teste pronta.');
  console.log(`Senha padrao: ${senha}`);
  console.log('');
  console.log('Contas de salao:');
  saloes.forEach((salao) => console.log(`- ${salao.email} | ${salao.fantasia} | ${salao.idSistema}`));
  console.log('');
  console.log('Contas de cliente:');
  clientes.forEach((cliente) => console.log(`- ${cliente.email} | ${cliente.nome} | ${cliente.uid}`));
}

main().catch((error) => {
  console.error('Falha ao popular massa de teste:', error.message);
  process.exit(1);
});