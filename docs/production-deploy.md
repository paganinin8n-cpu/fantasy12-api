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

## CI/CD automatizado da API e do frontend

Status:

- automatizado em .github/workflows/deploy.yml
- frontend automatizado em fantasy12-frontend/.github/workflows/deploy.yml

O workflow CI/CD API é a trilha oficial para a API:

- em pull_request para main:
  - instala dependências com npm ci
  - gera Prisma Client
  - roda npm run ci:check
  - valida build da imagem Docker com npm run docker:build
- em push para main ou execução manual:
  - repete os checks
  - empacota o código-fonte sem .env, node_modules, dist, backups ou artefatos locais
  - sincroniza o pacote no diretório do serviço api do EasyPanel no VPS
  - chama deployService via RPC do EasyPanel
  - aguarda https://api.fantasy12.com/health retornar api: ok

Segredos/variáveis necessários no GitHub:

~~~text
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_SSH_PASSPHRASE
EASYPANEL_URL
EASYPANEL_EMAIL
EASYPANEL_PASSWORD
~~~

Variável opcional:

~~~text
API_HEALTH_URL
~~~

Se API_HEALTH_URL não for definida, o workflow usa:

~~~text
https://api.fantasy12.com/health
~~~

Observações:

- o deploy continua não aplicando migrations automaticamente; produção permanece com RUN_DB_MIGRATIONS=false
- mudanças de schema devem passar por npm run prisma:schema:release:check e seguir a seção de migrations deste documento
- o workflow substitui o antigo deploy parcial que copiava apenas dist/ para dentro do container
- a sincronização preserva .env e .env.local remotos quando existirem no diretório do serviço

O workflow CI/CD frontend segue o mesmo padrão operacional:

- em push para master ou execução manual:
  - instala dependências com npm ci
  - roda npm run build como check
  - empacota o código-fonte sem .env, node_modules, dist ou artefatos locais
  - sincroniza o pacote no diretório do serviço frontend do EasyPanel no VPS
  - chama deployService via RPC do EasyPanel
  - valida que a URL pública está servindo o bundle atualizado

O frontend não deve mais publicar copiando dist/ diretamente para um container Nginx via
NGINX_CONTAINER_ID. A fonte de verdade em produção é o serviço frontend do EasyPanel.

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

### 5. Sincronizar arquivos no VPS e acionar deploy

> **Comportamento confirmado em 2026-06-27:** o `deployService` do EasyPanel reconstrói a
> imagem Docker a partir do diretório local `/etc/easypanel/projects/f12-prd/{service}/code/`
> no VPS. Ele **nao** faz `git pull` do GitHub antes do build quando `autoDeploy: false`.
> Por isso, é necessario copiar os arquivos alterados para o VPS antes de chamar o deploy.

#### 5a. Copiar arquivos alterados para o VPS (obrigatório)

Variáveis de contexto necessárias (ajuste `$CHANGED_FILES` conforme o que mudou):

```bash
VPS="root@72.60.51.161"
VPS_KEY="~/.ssh/fantasy12_vps"
API_CODE="/etc/easypanel/projects/f12-prd/api/code"
FE_CODE="/etc/easypanel/projects/f12-prd/frontend/code"
LOCAL_API="/Users/roberson/dev/personal/fantasy12-api"
LOCAL_FE="/Users/roberson/dev/personal/fantasy12-frontend"
```

Para a **API** (se houve mudança de código — exceto só docs):

```bash
# Copiar arquivos alterados da API para o VPS
# Listar os arquivos com: git diff --name-only origin/main
scp -i $VPS_KEY \
  $LOCAL_API/src/path/to/changed.ts \
  $VPS:$API_CODE/src/path/to/changed.ts
```

Para o **frontend** (listar arquivos com `git diff --name-only origin/master`):

```bash
# Exemplo: mudanças em componentes e páginas
scp -i $VPS_KEY \
  $LOCAL_FE/src/components/AppLayout.tsx \
  $VPS:$FE_CODE/src/components/AppLayout.tsx

scp -i $VPS_KEY \
  $LOCAL_FE/src/pages/Dashboard.tsx \
  $VPS:$FE_CODE/src/pages/Dashboard.tsx

# Para novas páginas, verificar se o diretório existe no VPS antes
scp -i $VPS_KEY \
  $LOCAL_FE/src/pages/NovaPage.tsx \
  $VPS:$FE_CODE/src/pages/NovaPage.tsx
```

A chave `~/.ssh/fantasy12_vps` tem passphrase. Para evitar digitar repetidamente:

```bash
ssh-add ~/.ssh/fantasy12_vps
# digitar a passphrase uma vez; ela fica no agent até o fim da sessão
```

Para copiar **múltiplos arquivos de uma vez** sem digitar a passphrase a cada scp:

```bash
# Lista os arquivos diff, monta o rsync
git -C $LOCAL_FE diff --name-only origin/master | while read f; do
  scp -i $VPS_KEY "$LOCAL_FE/$f" "$VPS:$FE_CODE/$f"
done
```

#### 5b. Acionar deploy via RPC

Após sincronizar os arquivos no VPS, chamar `deployService` para reconstruir a imagem e reiniciar o container:

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

Conferir progresso:

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
```

Builds reais demoram 2–5 min (npm install + tsc/vite). Se completar em menos de 30 s,
o EasyPanel usou cache Docker com arquivos nao atualizados — verificar se o SCP foi feito
corretamente antes de tentar de novo.

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

### 7. Acesso SSH ao VPS

Use SSH quando precisar validar container, crontab, logs ou arquivos operacionais no VPS Hostinger.

Dados confirmados:

```text
host: 72.60.51.161
user: root
key: ~/.ssh/fantasy12_vps
hostname remoto: srv969089
```

Comando padrao:

```bash
ssh root@72.60.51.161
```

Se o `~/.ssh/config` local estiver apontando para outro agent SSH, force a chave/agent correto:

```bash
ssh \
  -o IdentitiesOnly=yes \
  -o IdentityAgent="$SSH_AUTH_SOCK" \
  -i ~/.ssh/fantasy12_vps \
  root@72.60.51.161
```

Para comandos nao interativos:

```bash
ssh \
  -o BatchMode=yes \
  -o ConnectTimeout=20 \
  -o StrictHostKeyChecking=no \
  -o IdentitiesOnly=yes \
  -o IdentityAgent="$SSH_AUTH_SOCK" \
  -i ~/.ssh/fantasy12_vps \
  root@72.60.51.161 \
  'hostname && whoami'
```

Observacoes:

- A chave privada local tem passphrase; desbloqueie com `ssh-add ~/.ssh/fantasy12_vps` quando necessario.
- Nao registrar passphrase, `INTERNAL_JOB_SECRET`, tokens Easypanel ou senhas neste documento.
- A chave publica esperada no painel Hostinger aparece como `fantasy12-vps`.

Comandos uteis no VPS:

```bash
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
crontab -l
tail -40 /var/log/fantasy12-scheduler.log
curl -sS https://api.fantasy12.com/health
```

Scheduler de aplicacao (BullMQ worker; cron HTTP legado desativado apos migracao):

```text
worker: mesma revisao da API (`scripts/start-worker.sh`)
redis:  persistente + noeviction
log API jobs: InternalJobExecution / auditLog
recuperacao: /opt/fantasy12-infra/scripts/run-internal-job.sh
```

Validacao manual dos jobs (recovery):

```bash
/opt/fantasy12-infra/scripts/run-internal-job.sh /internal/open-scheduled-rounds
/opt/fantasy12-infra/scripts/run-internal-job.sh /internal/close-scheduled-rounds
/opt/fantasy12-infra/scripts/run-internal-job.sh /internal/close-expired-rankings
/opt/fantasy12-infra/scripts/run-internal-job.sh /internal/ensure-monthly-rankings
```

### 8. Migrations Prisma

Producao esta configurada com `RUN_DB_MIGRATIONS=false`; portanto, o deploy publica codigo e migrations, mas nao aplica `prisma migrate deploy` automaticamente.

Antes de aplicar migration em producao:

1. Confirmar backup recente do banco.
2. Rodar `npx prisma migrate status` contra o banco de producao.
3. Aplicar migration em janela controlada.
4. Validar `/health` e fluxos afetados.

Para mudancas que apenas deixam de usar um valor antigo no codigo, como a remocao logica de `UserRole.PRO`, o deploy de codigo pode ficar saudavel mesmo antes de remover fisicamente o valor antigo do enum no banco.

## 9. BullMQ worker (substitui cron de aplicacao)

### Arquitetura

- Redis persiste filas/schedules BullMQ.
- Processo **worker** separado (`node dist/worker.js` / `npm run start:worker`) consome a fila `fantasy12-jobs`.
- O processo HTTP da API **nao** executa workers.
- Processors chamam os mesmos services de dominio usados pelos endpoints `/internal/...`.
- PostgreSQL continua como fonte da verdade; `InternalJobExecution` + status de dominio/`settledAt` protegem contra entrega duplicada.

Schedules:

| Scheduler id | Frequencia | Service |
|---|---|---|
| `scheduler:open-scheduled-rounds` | a cada 1 min | `OpenScheduledRoundsJobService` |
| `scheduler:close-scheduled-rounds` | a cada 1 min | `CloseScheduledRoundsJobService` |
| `scheduler:close-expired-rankings` | a cada 1 min | `CloseExpiredRankingsJobService` |
| `scheduler:ensure-monthly-rankings` | `0 0 1 * *` `America/Sao_Paulo` | `EnsureMonthlyRankingsJobService` |
| `scheduler:reconcile-monthly-rankings` | `5 * * * *` + startup | `EnsureMonthlyRankingsJobService` (source=reconcile) |

### Variaveis de ambiente (worker)

```env
REDIS_URL=redis://:PASSWORD@HOST:6379/0
BULLMQ_PREFIX=fantasy12-prd
BULLMQ_WORKER_CONCURRENCY=1
BULLMQ_REGISTER_SCHEDULES=true
WORKER_HEALTH_PORT=3002
DATABASE_URL=postgresql://...
```

A API HTTP nao precisa de `REDIS_URL`. Nao logar `REDIS_URL` completo (credenciais).

### Redis em producao

- Persistencia AOF habilitada.
- `maxmemory-policy=noeviction` (obrigatorio para BullMQ).
- Autenticacao (`requirepass`) e volume persistente.
- Prefixo `BULLMQ_PREFIX` distinto por ambiente.

### Como subir o worker (EasyPanel)

1. Criar servico Redis no projeto `f12-prd`.
2. Criar servico `worker` usando a **mesma imagem/revisao** da API.
3. Command/override: `sh ./scripts/start-worker.sh` (ou `node dist/worker.js`).
4. Healthcheck: `curl -fsS http://127.0.0.1:3002/health`.
5. Wire `REDIS_URL`, `BULLMQ_*`, `DATABASE_URL` via secrets do painel (sem commit).

### Inspecionar jobs

No container do worker (ou host com `REDIS_URL`):

```bash
node -e "
const { Queue } = require('bullmq');
const q = new Queue('fantasy12-jobs', {
  connection: { url: process.env.REDIS_URL },
  prefix: process.env.BULLMQ_PREFIX || 'fantasy12',
});
(async () => {
  console.log(await q.getJobCounts('waiting','active','completed','failed','delayed'));
  console.log(await q.getJobSchedulers());
  await q.close();
  process.exit(0);
})();
"
```

### Retry seguro de job falho

1. Preferir o endpoint interno de recuperacao (idempotente no dominio):
   - `/internal/open-scheduled-rounds`
   - `/internal/close-scheduled-rounds`
   - `/internal/close-expired-rankings`
   - `/internal/ensure-monthly-rankings`
2. Ou reprocessar o failed job no BullMQ (`job.retry()`), confiante na idempotencia de banco.

### Validar timezone do monthly

O schedule `scheduler:ensure-monthly-rankings` usa `tz: America/Sao_Paulo` e cron `0 0 1 * *`.

```bash
node -e "console.log(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date()))"
```

O reconcile horario + reconcile no startup do worker cobre falha de Redis a meia-noite.

### Migracao cron -> BullMQ

1. Deploy Redis.
2. Deploy worker com `BULLMQ_REGISTER_SCHEDULES=true`.
3. Confirmar worker `/health` e counts completed aumentando.
4. Comentar apenas as linhas de aplicacao em `fantasy12-infra/scripts/cron.txt` (manter backup/retention).
5. Manter endpoints internos para recovery.
6. Rollback: reativar as duas linhas `* * * * * ... open/close-scheduled-rounds` se Redis/worker falharem.

Durante overlap cron+BullMQ, a protecao final e a idempotencia no PostgreSQL — nao apenas dedupe do BullMQ.
