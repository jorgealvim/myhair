# Importador de CNPJs para o MyHair

Este script filtra empresas de Juiz de Fora/MG com perfil de salao, barbearia ou estetica a partir de uma base publica de CNPJ e gera um JSON pronto para carga no banco do projeto.

## O que ele faz

- filtra por cidade e UF
- filtra por CNAE de beleza/estetica
- usa palavras-chave quando a base nao vier com CNAE padronizado
- opcionalmente enriquece cada CNPJ com dados detalhados via BrasilAPI
- gera JSON no formato mais proximo do usado pelo MyHair

## Fontes esperadas

O script aceita arquivos:

- .csv
- .json
- .jsonl
- .ndjson

Campos comuns suportados:

- cnpj, cnpj_basico, cnpj_ordem, cnpj_dv
- municipio, cidade, descricao_municipio
- uf, estado
- razao_social, nome_fantasia
- cnae_fiscal_principal, cnae_fiscal_secundaria

## Como usar

Exemplo sem enriquecimento:

```powershell
node scripts/importar_cnpjs.js --input dados\cnpj-jf.csv --output exports\saloes-jf.json
```

Exemplo com enriquecimento por API:

```powershell
node scripts/importar_cnpjs.js --input dados\cnpj-jf.csv --output exports\saloes-jf.json --enriquecer --limite 100
```

## Parametros

- --input: arquivo de entrada
- --output: arquivo de saida
- --cidade: padrao Juiz de Fora
- --uf: padrao MG
- --limite: limita quantidade final exportada
- --enriquecer: consulta detalhes por CNPJ via API publica

## Observacoes importantes

- a Receita nao oferece busca simples por "todos os saloes da cidade" em uma unica API publica de consulta
- por isso o fluxo recomendado e base publica + filtragem + enriquecimento opcional
- para volumes grandes, use o modo sem enriquecimento primeiro
- depois importe o JSON gerado para o Firestore ou revise os dados antes da carga

## Proximos passos sugeridos

1. baixar uma base publica de CNPJ com empresas ativas
2. rodar o script para Juiz de Fora/MG
3. revisar o JSON gerado em exports\saloes-jf.json
4. importar no Firestore com o script scripts\importar_firestore.js

## Carga automatica no Firestore

Foi adicionado o script scripts\importar_firestore.js para enviar o JSON filtrado para a colecao usuarios do Firebase.

Exemplo de simulacao:

```powershell
node scripts/importar_firestore.js --input exports\saloes-jf.json --dry-run
```

Exemplo de importacao real:

```powershell
node scripts/importar_firestore.js --input exports\saloes-jf.json --service-account chave-firebase.json --collection usuarios --modo merge
```

Modos disponiveis:

- merge: atualiza sem apagar campos existentes
- overwrite: sobrescreve todo o documento
- skip-existing: importa apenas documentos ainda nao existentes

O ID do documento e gerado preferencialmente a partir do CNPJ para evitar duplicidade.
Cada empresa exportada tambem recebe um campo idSistema no padrao do MyHair, que pode ser usado pelas telas de listagem e perfil.