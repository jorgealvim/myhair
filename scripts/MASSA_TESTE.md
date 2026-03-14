# Massa de teste do MyHair

Este projeto agora tem um script para criar contas demo no Firebase Auth e gravar dados de teste no Firestore.

## O que ele cria

- 3 saloes demo
- 3 clientes demo
- agenda com horarios livres e 1 horario ocupado
- servicos e produtos
- favoritos
- solicitacoes de agendamento
- solicitacoes de compra
- avaliacoes em estrelas

## Senha padrao

- Teste@123

## Antes de rodar

1. Baixe a chave JSON de conta de servico do Firebase Console.
2. Na pasta do projeto, instale a dependencia:

```powershell
npm install
```

## Como rodar

```powershell
npm run popular:teste -- --service-account caminho\chave-firebase.json
```

Se quiser trocar a senha padrao:

```powershell
npm run popular:teste -- --service-account caminho\chave-firebase.json --senha MinhaSenha@123
```

## Contas que serao criadas

Saloes:

- salao1@myhair.test
- salao2@myhair.test
- salao3@myhair.test

Clientes:

- cliente1@myhair.test
- cliente2@myhair.test
- cliente3@myhair.test

## Como testar sozinho

1. Entre como um cliente demo e abra a visao geral.
2. Teste favoritos, servicos, produtos e agendamento.
3. Abra uma janela anonima e entre como um salao demo.
4. No perfil do salao, valide solicitacoes pendentes e compras.
5. Use perfis diferentes para validar avaliacoes cruzadas.

## Observacao

O script usa `merge`, entao pode ser executado novamente para atualizar a massa demo sem apagar seus outros dados.