# Audit Da Trilha De Migrations

## Status Atual

A trilha histórica de migrations do `fantasy12-api` **não sobe um banco vazio sozinha**.

Hoje, o caminho operacional seguro e:

- banco vazio: `npm run prisma:bootstrap:fresh`
- banco existente: `npm run prisma:migrate:deploy`

No fluxo de banco vazio, o bootstrap aplica o schema atual com `prisma db push` e depois marca as migrations historicas como aplicadas. Isso evita que ambientes fresh tentem executar a cadeia antiga, que foi escrita para um banco pre-existente.

## Evidências Objetivas

### 1. `20260119_baseline_v1` é um baseline vazio

Arquivo:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/migrations/20260119_baseline_v1/migration.sql`

Conteúdo:

```sql
-- Baseline migration
-- Existing production database
-- No changes applied
```

Ou seja: a própria primeira migration assume um banco pré-existente.

### 2. `20260120_bolao_invites` referencia tabelas ainda inexistentes

Arquivo:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/migrations/20260120_bolao_invites/migration.sql`

Problema:

- cria `bolao_invites`
- cria FK para `rankings`
- cria FK para `users`

Trecho crítico:

```sql
ALTER TABLE "bolao_invites"
ADD CONSTRAINT "bolao_invites_rankingId_fkey"
FOREIGN KEY ("rankingId")
REFERENCES "rankings"("id")
ON DELETE CASCADE;
```

Em banco vazio, `rankings` ainda não foi criada pela cadeia histórica anterior. Esse foi exatamente o erro de produção que vimos:

- `P3009`
- `ERROR: relation "rankings" does not exist`

### 3. `20260120_monetizacao_core` depende de `users` e `rounds`

Arquivo:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/migrations/20260120_monetizacao_core/migration.sql`

Problema:

- cria `subscriptions`, `wallets`, `wallet_ledger`, `round_benefits`
- cria FKs para `users`
- cria FK para `rounds`

Trechos críticos:

```sql
REFERENCES "users"("id")
```

```sql
REFERENCES "rounds"("id")
```

Isso confirma que a migration pressupõe entidades centrais já existentes.

### 4. `20260122_v1_5_subscription_recorrente` está em UTF-16LE

Arquivo:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/migrations/20260122_v1_5_subscription_recorrente/migration.sql`

Sinais observados:

- arquivo contém bytes nulos
- leitura correta acontece em `utf16le`

Isso aumenta risco operacional para diff, revisão humana e tooling.

### 5. A baseline canônica do schema atual é maior do que a história migratória efetiva

Geramos o schema fresh diretamente do Prisma em:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/baselines/current-fresh-schema.sql`

Esse SQL inclui desde o zero:

- enums como `PaymentProvider`
- tabelas como `users`, `rounds`, `rankings`, `subscriptions`, `payments`
- todas as FKs finais esperadas

Isso comprova que o estado final do schema existe e é consistente, mas a cadeia histórica não chega nele a partir de banco vazio sem apoio externo.

## Comando Oficial De Baseline Fresh

Para regenerar a baseline canônica:

```sh
npm run prisma:baseline:fresh:generate
```

## Decisão Operacional Atual

### Banco novo

Usar:

```sh
npm run prisma:bootstrap:fresh
```

Esse comando:

- bloqueia banco nao vazio por padrao
- aplica o schema atual
- registra a trilha historica em `_prisma_migrations`
- executa seeds minimas

### Banco existente com histórico Prisma

Usar:

```sh
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

Se houver migration quebrada, diagnosticar e resolver explicitamente antes do deploy.

## Próximo Passo Estrutural Recomendado

Decisao tomada em 2026-06-06:

- manter `db push + migrate resolve --applied + seeds` como bootstrap oficial para ambiente novo
- manter a cadeia historica congelada como legado auditado
- criar novas migrations normalmente daqui para frente
- validar o contrato com `npm run prisma:migration:policy:check`

A cadeia historica continua nao sendo uma fonte unica confiavel para subir banco vazio, mas isso deixa de ser ambiguidade operacional: banco vazio nao usa essa cadeia para construir schema.
