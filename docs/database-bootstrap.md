# Bootstrap de Banco

## Objetivo

Padronizar como o Fantasy12 sobe em um banco novo sem repetir o problema das migrations historicas quebrando ambientes fresh.

## Regra prática

Use dois fluxos diferentes:

- banco vazio: `prisma db push + registro da trilha historica + seeds`
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
5. aplica constraints operacionais não representáveis no schema Prisma, incluindo o índice parcial de rodada única `OPEN` e invariantes de saldos/estoques não negativos
6. marca as migrations historicas como aplicadas em `_prisma_migrations`
7. roda `seed-admin-permissions`
8. roda `seed:app`, incluindo o catálogo canônico de times e seleções

Esse registro das migrations e intencional. Como o `db push` ja deixa o schema no estado atual, marcar a historia antiga como aplicada impede que um banco fresh tente executar a cadeia legada quebrada no primeiro `migrate deploy` futuro.

Existe uma rota de escape apenas para diagnostico:

```sh
npm run prisma:bootstrap:fresh -- --skip-migration-resolve
```

Nao use essa opcao em ambiente novo normal.

## Catálogo de times

O seed principal inclui o catálogo versionado de clubes e seleções em
`prisma/seed-teams.js`. A execução é idempotente: registros existentes são
reconciliados por chave canônica, nome ou alias, e logos cadastrados manualmente
são preservados quando o catálogo não fornece `logoUrl`.

Para validar o catálogo sem acessar o banco:

```sh
npm run seed:teams:dry-run
```

Para aplicar somente esse catálogo em um banco já preparado:

```sh
npm run seed:teams
```

O seed não desativa times que estejam fora do catálogo atual. Essa decisão é
intencional para preservar referências históricas de rodadas existentes.

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

- `migrate deploy` é apropriado para bancos que já nasceram nesse histórico ou que foram bootstrapados pelo fluxo oficial atual
- `db push + migrate resolve --applied + seeds` é o caminho seguro para um banco realmente novo

## Baseline canônica do schema atual

Também mantemos uma baseline fresh gerada diretamente do `schema.prisma` em:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/baselines/current-fresh-schema.sql`

Para regenerar:

```sh
npm run prisma:baseline:fresh:generate
```

Para verificar se a baseline versionada ainda bate com o `schema.prisma`:

```sh
npm run prisma:baseline:fresh:verify
```

## Politica de migrations

O contrato oficial agora e:

- migrations antigas ficam congeladas como legado auditado
- banco novo nasce pelo bootstrap fresh e registra a trilha historica como aplicada
- migrations novas continuam sendo criadas normalmente em `prisma/migrations`
- banco existente evolui com `npm run prisma:migrate:deploy`
- toda mudanca de schema deve passar por `npm run prisma:schema:release:check`

Para validar que essa politica continua preservada:

```sh
npm run prisma:migration:policy:check
```

Para o racional detalhado da auditoria da cadeia histórica, veja:

- `/Users/roberson/dev/personal/fantasy12-api/docs/migration-chain-audit.md`

Para rodar a auditoria automatizada da cadeia:

```sh
npm run prisma:migrate:audit:chain
```

Para rodar a mesma auditoria em modo apenas informativo:

```sh
npm run prisma:migrate:audit:chain:report
```

Para o plano de conversao futura para uma baseline Prisma definitiva:

- `/Users/roberson/dev/personal/fantasy12-api/docs/migration-baseline-plan.md`

Para o checklist operacional de mudança de schema:

- `/Users/roberson/dev/personal/fantasy12-api/docs/schema-change-checklist.md`
