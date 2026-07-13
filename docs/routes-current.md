# Rotas Atuais da API

## Base

- app principal monta rotas públicas e admin sob `/api`
- rotas internas sob `/internal`
- auth por sessão em `/api/auth/*`

## Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`

## Usuário

- `POST /api/users`
- `POST /api/login`
- `GET /api/me`
- `PATCH /api/me`
- `POST /api/me/password`

Observação:

- `POST /api/login` aparenta ser legado/paralelo ao fluxo canônico `/api/auth/login`
- `/api/me` e o fluxo autenticado atual expõem dados de perfil e `adminRoles`

## Tickets

- `POST /api/tickets`
- `GET /api/tickets/current`
- `GET /api/tickets`

## Rodadas

- `GET /api/rounds`
- `GET /api/rounds/open`
- `GET /api/rounds/:roundId/matches`

Observação:

- `GET /api/rounds/open` retorna `matches` quando a rodada ativa possui os 12 jogos cadastrados
- `GET /api/rounds/:roundId/matches` lista os jogos da rodada ordenados por `position`

## Rankings

- `GET /api/rankings/monthly`
- `GET /api/rankings/semester`
- `GET /api/rankings/weekly`
- `GET /api/rankings/:rankingId`
- `POST /api/rankings/:rankingId/join`
- `GET /api/rankings/:rankingId/bolao`
- `POST /api/rankings/:rankingId/invites`
- `GET /api/boloes/me`
- `GET /api/boloes/available`
- `POST /api/boloes`
- `POST /api/boloes/invites/:code/join`

Observação:

- `POST /api/boloes` exige sessão autenticada e assinatura PRO anual ativa para criação

## Wallet e assinatura

- `GET /api/wallet`
- `GET /api/subscription/plans`
- `GET /api/subscription`
- `POST /api/subscription/checkout`
- `DELETE /api/subscription`

Observação:

- `GET /api/subscription/plans` lista os planos PRO mensais e anuais disponíveis para a interface
- `POST /api/subscription/checkout` cria uma preferência Mercado Pago para o plano escolhido e retorna `checkoutUrl`
- a ativacao financeira ocorre quando o webhook de pagamento aprovado confirma `metadata.plan` e `metadata.user_id`

## Benefícios táticos

- `GET /api/benefits/balance`
- `POST /api/benefits/purchase`

Observação:

- `GET /api/benefits/balance` pode receber `roundId` para somar benefícios gratuitos da rodada ao inventário comprado
- o saldo separa quantidades grátis e pagas e também retorna `totalDoubles`/`totalSuperDoubles` (com aliases legados `availableDoubles`/`availableSuperDoubles`)
- `POST /api/benefits/purchase` compra pacotes de duplas/super duplas com fichas da wallet
- no envio do ticket, o limite é o saldo total disponível; o consumo usa primeiro o saldo grátis da rodada e depois o inventário pago
- os pacotes atuais são `double_single`, `double_combo`, `double_total`, `super_single` e `super_master`

## Pagamentos

- `POST /api/payments`
- `GET /api/payment-packages`
- `GET /api/payments/history`

Observação:

- há uma rota duplicada de `payment-packages` em arquivo separado, mas o path consumido atual existe

## Admin

### Rodadas

- `GET /api/admin/rounds`
- `POST /api/admin/rounds`
- `PATCH /api/admin/rounds/:roundId`
- `POST /api/admin/rounds/:roundId/open`
- `POST /api/admin/rounds/:roundId/result`
- `POST /api/admin/rounds/:roundId/close`

Observação:

- `POST /api/admin/rounds` cria a rodada em `DRAFT` com exatamente 12 jogos
- `PATCH /api/admin/rounds/:roundId` edita datas e jogos apenas enquanto a rodada está em `DRAFT`
- `POST /api/admin/rounds/:roundId/result` aceita o resultado consolidado `1,X,2,...` e sincroniza o resultado por jogo em `round_matches`

### Assinaturas admin

- `GET /api/admin/subscriptions`

### Usuários admin

- `GET /api/admin/users`

### Logs admin

- `GET /api/admin/logs`

### Operação admin

- `GET /api/admin/operational/status`

Observação:

- expõe sinais agregados de pagamentos, webhooks, assinaturas, rodada aberta e configuração crítica

### Monetização admin

- `GET /api/admin/monetization/wallet/:userId`
- `GET /api/admin/monetization/ledger/:userId`
- `GET /api/admin/monetization/subscriptions/:userId`
- `POST /api/admin/monetization/wallet/:userId/credit`

## Internas

### Jobs

- `POST /internal/jobs/score-round`
- `POST /internal/jobs/close-expired-rankings`
- `POST /internal/jobs/open-round`
- `POST /internal/jobs/subscriptions/revalidate`

### Webhooks

- `POST /internal/webhooks/mercado-pago`

## Saúde

- `GET /health`
- `GET /`

Observação:

- `/health` consulta o banco com `SELECT 1` e retorna `503` se a conexão falhar
