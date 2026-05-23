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
- `GET /api/subscription`
- `DELETE /api/subscription`

## Benefícios táticos

- `GET /api/benefits/balance`
- `POST /api/benefits/purchase`

Observação:

- `GET /api/benefits/balance` pode receber `roundId` para somar benefícios gratuitos da rodada ao inventário comprado
- `POST /api/benefits/purchase` compra pacotes de duplas/super duplas com fichas da wallet
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
- `POST /api/admin/rounds/:roundId/open`
- `POST /api/admin/rounds/:roundId/result`
- `POST /api/admin/rounds/:roundId/close`

### Assinaturas admin

- `GET /api/admin/subscriptions`

### Usuários admin

- `GET /api/admin/users`

### Logs admin

- `GET /api/admin/logs`

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
