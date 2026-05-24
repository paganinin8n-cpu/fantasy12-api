# Deploy de Produção

## Objetivo

Padronizar o deploy da API no EasyPanel sem depender de migrations automáticas no boot do container.

## Situação atual

O banco de produção já apresentou erro de migration falha:

- `20260120_bolao_invites`

Quando isso acontece, `prisma migrate deploy` bloqueia o boot da API com erro `P3009`.

## Decisão operacional

O container da API nao deve mais depender obrigatoriamente de `migrate deploy` no startup.

Em vez disso:

- o boot da API sobe normalmente
- migrations ficam controladas por `RUN_DB_MIGRATIONS=true` ou por execução manual no console

## Estratégia oficial de banco

Hoje o projeto tem dois cenários diferentes:

### 1. Ambiente novo, banco vazio

Fluxo oficial:

```sh
npm run prisma:bootstrap:fresh
```

Esse comando:

- valida se o banco esta realmente vazio
- aplica `prisma db push`
- roda `seed:admin-permissions`
- roda `seed:app`

Isso evita depender da trilha historica de migrations, que ainda nao sobe um banco novo de ponta a ponta com segurança.

### 2. Ambiente existente

Fluxo oficial:

- subir a API com `RUN_DB_MIGRATIONS=false`
- diagnosticar o estado da trilha existente
- resolver migrations quebradas
- só então rodar `prisma migrate deploy`

Em resumo:

- banco novo: `db push + seeds`
- banco existente: `migrate resolve/deploy`

## Variáveis recomendadas no EasyPanel

### API

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
SESSION_SECRET=change-me
JWT_SECRET=change-me-too
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
FRONTEND_ORIGIN=https://www.fantasy12.com
CORS_ALLOWED_ORIGINS=https://www.fantasy12.com
INTERNAL_JOB_SECRET=change-me-too
RUN_DB_MIGRATIONS=false
MP_ACCESS_TOKEN=APP_USR-...
MP_WEBHOOK_SECRET=change-me-too
API_PUBLIC_URL=https://api.fantasy12.com
```

## Primeiro deploy

1. subir o Postgres
2. subir a API com `RUN_DB_MIGRATIONS=false`
3. se for banco novo, rodar `npm run prisma:bootstrap:fresh`
4. se for banco existente, abrir o console da API no EasyPanel
5. diagnosticar o estado das migrations

## Observação importante sobre autenticação

A API também exige `JWT_SECRET` no ambiente.

Sem essa variável, o container sobe e cai imediatamente com erro em `dist/utils/jwt.js`.

Se você ainda não tiver uma estratégia separada para JWT, pode usar o mesmo valor do `SESSION_SECRET` temporariamente, embora o ideal seja manter secrets distintos.

## Comandos úteis no console da API

### Ver status das migrations

```sh
npm run prisma:migrate:status
```

### Diagnosticar automaticamente a migration quebrada

```sh
npm run prisma:migrate:diagnose:bolao
```

Esse comando verifica:

- se a tabela `_prisma_migrations` existe
- se a migration `20260120_bolao_invites` consta como falha
- se a tabela `bolao_invites` já existe

Com base nisso, ele sugere se o caminho correto é `rolled-back` ou `applied`.

### Resolver a migration problemática como rollback

Use se a tabela/alteração da migration falha nao existir no banco.

```sh
npm run prisma:migrate:resolve:bolao:rolled-back
```

### Resolver a migration problemática como applied

Use se a estrutura da migration já existir no banco.

```sh
npm run prisma:migrate:resolve:bolao:applied
```

### Aplicar migrations após resolver o estado

```sh
npm run prisma:migrate:deploy
```

## Como decidir entre `rolled-back` e `applied`

### Use `rolled-back` quando

- a migration falhou e a estrutura dela nao existe no banco

### Use `applied` quando

- a estrutura já existe no banco
- a migration só ficou marcada como falha em `_prisma_migrations`

## Fluxo recomendado

### Banco novo

1. API sobe com `RUN_DB_MIGRATIONS=false`
2. você roda `npm run prisma:bootstrap:fresh`
3. se houve mudança recente de schema, valide antes com `npm run prisma:schema:release:check`
3. valida `/health`
4. valida login e seeds iniciais

### Banco existente

1. API sobe com `RUN_DB_MIGRATIONS=false`
2. se houve mudança recente de schema, valide antes com `npm run prisma:schema:release:check`
2. você roda `npm run prisma:migrate:diagnose:bolao`
3. você resolve o estado das migrations pelo console
4. roda `npm run prisma:migrate:deploy`
5. se tudo estiver consistente, opcionalmente muda `RUN_DB_MIGRATIONS=true` nos próximos deploys

## Checklist curto para release de schema

Sempre que mexer em `schema.prisma` ou baseline:

```sh
npm run prisma:schema:release:check
```

Se a baseline ficar defasada:

```sh
npm run prisma:baseline:fresh:generate
npm run prisma:baseline:fresh:verify
```

## Observação importante

Mesmo com o mecanismo de boot controlado, o ideal é tratar migrations em produção como etapa explícita de release, e nao como efeito colateral do startup da aplicação.
