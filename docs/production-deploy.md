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

## Variáveis recomendadas no EasyPanel

### API

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
SESSION_SECRET=change-me
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
FRONTEND_ORIGIN=https://www.fantasy12.com
CORS_ALLOWED_ORIGINS=https://www.fantasy12.com
INTERNAL_JOB_SECRET=change-me-too
RUN_DB_MIGRATIONS=false
```

## Primeiro deploy

1. subir o Postgres
2. subir a API com `RUN_DB_MIGRATIONS=false`
3. abrir o console da API no EasyPanel
4. diagnosticar o estado das migrations

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

1. API sobe com `RUN_DB_MIGRATIONS=false`
2. você roda `npm run prisma:migrate:diagnose:bolao`
3. você resolve o estado das migrations pelo console
4. roda `npm run prisma:migrate:deploy`
5. se tudo estiver consistente, opcionalmente muda `RUN_DB_MIGRATIONS=true` nos próximos deploys

## Observação importante

Mesmo com o mecanismo de boot controlado, o ideal é tratar migrations em produção como etapa explícita de release, e nao como efeito colateral do startup da aplicação.
