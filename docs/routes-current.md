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

Observação:

- `POST /api/login` aparenta ser legado/paralelo ao fluxo canônico `/api/auth/login`

## Tickets

- `POST /api/tickets`

## Rodadas

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
- `POST /api/boloes/invites/:code/join`

## Wallet e assinatura

- `GET /api/wallet`
- `GET /api/subscription`

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
