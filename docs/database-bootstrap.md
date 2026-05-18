# Bootstrap de Banco

## Objetivo

Padronizar como o Fantasy12 sobe em um banco novo sem repetir o problema das migrations historicas quebrando ambientes fresh.

## Regra prática

Use dois fluxos diferentes:

- banco vazio: `prisma db push + seeds`
- banco existente: `prisma migrate resolve/deploy`

## Fluxo para banco vazio

Comando oficial:

```sh
npm run prisma:bootstrap:fresh
```

Esse comando:

1. builda a API para garantir que `dist/lib/prisma.js` exista
2. inspeciona as tabelas do schema `public`
3. bloqueia a execução se o banco já tiver tabelas
4. roda `prisma db push --skip-generate`
5. roda `seed-admin-permissions`
6. roda `seed:app`

## Fluxo para banco já existente

Use:

```sh
npm run prisma:migrate:status
npm run prisma:migrate:diagnose:bolao
```

Depois siga com:

```sh
npm run prisma:migrate:resolve:bolao:rolled-back
```

ou:

```sh
npm run prisma:migrate:resolve:bolao:applied
```

e finalize com:

```sh
npm run prisma:migrate:deploy
```

## O que não fazer

Nao rode `prisma:bootstrap:fresh` em banco já populado.

O script foi feito para abortar nesse cenário justamente para evitar sobrescrever ou mascarar um estado real de produção.

## Motivo técnico

A trilha atual de migrations ainda carrega histórico incremental que assume estruturas antigas já existentes, por exemplo:

- `20260119_baseline_v1` é vazio
- `20260120_bolao_invites` referencia `rankings`
- outras migrations assumem tabelas já presentes

Por isso:

- `migrate deploy` é apropriado para bancos que já nasceram nesse histórico
- `db push` é o caminho seguro para um banco realmente novo, até a baseline definitiva ser reorganizada

## Baseline canônica do schema atual

Também mantemos uma baseline fresh gerada diretamente do `schema.prisma` em:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/baselines/current-fresh-schema.sql`

Para regenerar:

```sh
npm run prisma:baseline:fresh:generate
```

Para o racional detalhado da auditoria da cadeia histórica, veja:

- `/Users/roberson/dev/personal/fantasy12-api/docs/migration-chain-audit.md`
