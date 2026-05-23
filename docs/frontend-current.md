# Frontend Atual

## Estado geral

O frontend ativo está alinhado com a API principal e já contém as superfícies novas de perfil, bolões e administração básica.

## Fluxo ativo confirmado

### Autenticação

Arquivos centrais:

- `fantasy12-frontend/src/app/auth.tsx`
- `fantasy12-frontend/src/app/AuthProvider.tsx`
- `fantasy12-frontend/src/modules/auth/auth.service.ts`

Contrato ativo:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`

Modelo atual:

- sessão por cookie
- bootstrap do usuário via `/api/me`
- frontend sem dependência de token

### Rotas de aplicação ativas

Arquivo:

- `fantasy12-frontend/src/app/router.tsx`

Rotas em uso:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/`
- `/dashboard`
- rota legada `/betting`, redirecionada para `/ticket`
- `/wallet`
- `/payments`
- `/subscription`
- `/bar`
- `/ticket`
- `/palpites`
- `/profile`
- `/boloes`
- `/boloes/:rankingId`
- `/tickets`
- `/terms`
- `/privacy`
- `/faq`
- `/admin/rounds`
- `/admin/users`
- `/admin/logs`

Observação:

- a rota legada `betting` foi redirecionada para o fluxo de `TicketPage`
- as rotas admin passam por guarda de autenticação e papel administrativo

## Consumo real de API no fluxo ativo

### Dashboard

- `GET /api/rankings/monthly`
- `GET /api/rounds/open`
- `GET /api/tickets/current`
- `GET /api/boloes/me`

### Ticket

- `GET /api/rounds/open`
- `POST /api/tickets`
- `GET /api/tickets/current`
- `GET /api/benefits/balance`

### Perfil

- `GET /api/me`
- `PATCH /api/me`
- `POST /api/me/password`

### Bolões

- `GET /api/boloes/me`
- `GET /api/boloes/available`
- `POST /api/boloes`
- `GET /api/rankings/:rankingId/bolao`
- `POST /api/rankings/:rankingId/join`
- `POST /api/boloes/invites/:code/join`

### Wallet e pagamentos

- `GET /api/wallet`
- `GET /api/payment-packages`
- `POST /api/payments`
- `GET /api/payments/history`
- `POST /api/benefits/purchase`

Observação:

- a `BarPage` tem `Menu Tatico` para comprar duplas e super duplas com fichas
- a tela de ticket desabilita duplas/super duplas quando o saldo disponivel nao comporta nova selecao

### Subscription

- `GET /api/subscription`
- `DELETE /api/subscription`

### Admin de rodadas

- `GET /api/admin/rounds`
- `POST /api/admin/rounds`
- `POST /api/admin/rounds/:roundId/open`
- `POST /api/admin/rounds/:roundId/result`
- `POST /api/admin/rounds/:roundId/close`

### Admin de usuários

- `GET /api/admin/users`

### Admin de logs

- `GET /api/admin/logs`

## Limpeza de legado

### Removido

- `src/pages/Ranking.tsx`, pagina orfa que consumia `/api/ranking`

### Mantido por compatibilidade

- `/betting`, apenas como redirecionamento para `/ticket`

### Estado atual

- `src/pages/AdminPage.tsx` ja nao existe
- nao ha pagina legada orfa confirmada no fluxo ativo

## Conclusão

O frontend ativo hoje é o conjunto:

- auth por sessão
- dashboard
- ticket
- historico de palpites
- wallet
- payments
- subscription
- bar
- menu tatico de compra de duplas/super duplas
- perfil
- bolões
- admin/rounds
- admin/users
- admin/logs
