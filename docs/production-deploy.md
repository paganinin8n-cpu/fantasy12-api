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
- marca a trilha historica de migrations como aplicada
- roda `seed:admin-permissions`
- roda `seed:app`

Isso evita depender da trilha historica de migrations, que ainda nao sobe um banco novo de ponta a ponta com segurança.
Depois desse bootstrap, migrations futuras podem ser aplicadas com `npm run prisma:migrate:deploy`.

### 2. Ambiente existente

Fluxo oficial:

- subir a API com `RUN_DB_MIGRATIONS=false`
- diagnosticar o estado da trilha existente
- resolver migrations quebradas
- só então rodar `prisma migrate deploy`

Em resumo:

- banco novo: `db push + migrate resolve --applied + seeds`
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
## Deploy funcional via Easypanel RPC

Registro do fluxo validado em 2026-06-21 para publicar API e frontend em producao.

### Premissas

- Backend remoto: `fantasy12-api` branch `main`.
- Frontend remoto: `fantasy12-frontend` branch `master`.
- Projeto no Easypanel: `f12-prd`.
- Servicos no Easypanel: `api` e `frontend`.
- Credenciais do painel ficam em `.env.local`:
  - `EASYPANEL_URL`
  - `EASYPANEL_EMAIL`
  - `EASYPANEL_PASSWORD`

Nao registrar token, senha, `SESSION_SECRET`, `DATABASE_URL`, chaves Mercado Pago ou SMTP na documentacao.

### 1. Build/check local antes do push

```bash
cd /Users/roberson/dev/personal/fantasy12-api
npm run build
DATABASE_URL=postgresql://fantasy12:fantasy12@localhost:5432/fantasy12?schema=public npx prisma validate

cd /Users/roberson/dev/personal/fantasy12-frontend
npx tsc --noEmit
npm run build
```

### 2. Commit e push

```bash
cd /Users/roberson/dev/personal/fantasy12-api
git status --short
git add <arquivos>
git commit -m "feat: ..."
git push origin main

cd /Users/roberson/dev/personal/fantasy12-frontend
git status --short
git add <arquivos>
git commit -m "feat: ..."
git push origin master
```

### 3. Login no Easypanel RPC

O painel usa RPC em `/api/rpc/*`. O login funcional usa envelope `{ "json": ... }`.

```bash
cd /Users/roberson/dev/personal/fantasy12-api

node - <<'NODE'
const fs = require('fs')
const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index), line.slice(index + 1)]
    })
)

fs.writeFileSync(
  '/tmp/easypanel-login.json',
  JSON.stringify({
    json: {
      email: env.EASYPANEL_EMAIL,
      password: env.EASYPANEL_PASSWORD,
      rememberMe: true
    }
  })
)
NODE

source .env.local
BASE=${EASYPANEL_URL%/}

curl -sS \
  -X POST "$BASE/api/rpc/auth/login" \
  -H "content-type: application/json" \
  --data @/tmp/easypanel-login.json \
  > /tmp/easypanel-login-response.json

node - <<'NODE'
const fs = require('fs')
const response = JSON.parse(fs.readFileSync('/tmp/easypanel-login-response.json', 'utf8'))
fs.writeFileSync('/tmp/easypanel-token.txt', response.json.token)
NODE
```

### 4. Conferir projeto e servicos

```bash
TOKEN=$(cat /tmp/easypanel-token.txt)

curl -sS \
  -X POST "$BASE/api/rpc/projects/listProjectsAndServices" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data '{"json":{}}' \
  > /tmp/easypanel-projects.json
```

Resumo esperado:

```text
project: f12-prd
service: api       type: app
service: frontend  type: app
service: postgres  type: postgres
```

### 5. Acionar deploy

```bash
TOKEN=$(cat /tmp/easypanel-token.txt)

printf '%s' '{"json":{"projectName":"f12-prd","serviceName":"api"}}' \
  > /tmp/easypanel-deploy-api.json

printf '%s' '{"json":{"projectName":"f12-prd","serviceName":"frontend"}}' \
  > /tmp/easypanel-deploy-frontend.json

curl -sS \
  -X POST "$BASE/api/rpc/services/app/deployService" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data @/tmp/easypanel-deploy-api.json

curl -sS \
  -X POST "$BASE/api/rpc/services/app/deployService" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data @/tmp/easypanel-deploy-frontend.json
```

Se a chamada demorar ou ficar aberta, conferir o status em `actions/listActions`.

```bash
curl -sS \
  -X POST "$BASE/api/rpc/actions/listActions" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  --data '{"json":{}}' \
  > /tmp/easypanel-actions.json
```

Deploy bem-sucedido aparece como:

```text
projectName: f12-prd
serviceName: api|frontend
type: deployment
status: done
description: Deploy service: <mensagem do commit>
```

### 6. Validacao pos-deploy

```bash
curl -sS https://api.fantasy12.com/health
curl -sS -I https://www.fantasy12.com | head -40
curl -sS https://www.fantasy12.com | head -40
```

Esperado:

- API retorna `{"api":"ok","db":"ok",...}`.
- Frontend retorna `HTTP/2 200`.
- Header `last-modified` do frontend muda para o horario do deploy.
- HTML aponta para novo asset `/assets/index-*.js`.

### 7. Migrations Prisma

Producao esta configurada com `RUN_DB_MIGRATIONS=false`; portanto, o deploy publica codigo e migrations, mas nao aplica `prisma migrate deploy` automaticamente.

Antes de aplicar migration em producao:

1. Confirmar backup recente do banco.
2. Rodar `npx prisma migrate status` contra o banco de producao.
3. Aplicar migration em janela controlada.
4. Validar `/health` e fluxos afetados.

Para mudancas que apenas deixam de usar um valor antigo no codigo, como a remocao logica de `UserRole.PRO`, o deploy de codigo pode ficar saudavel mesmo antes de remover fisicamente o valor antigo do enum no banco.
