# Frontend Atual

## Estado geral

O frontend ativo está mais alinhado com a API do que no início da análise, mas ainda coexistem páginas legadas fora do fluxo canônico.

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
- `/`
- `/dashboard`
- `/betting`
- `/wallet`
- `/payments`
- `/subscription`
- `/bar`
- `/ticket`
- `/admin/rounds`

Observação:

- `betting` foi redirecionado para o fluxo de `TicketPage`

## Consumo real de API no fluxo ativo

### Dashboard

- `GET /api/rankings/monthly`

### Ticket

- `GET /api/rounds/open`
- `POST /api/tickets`

### Wallet e pagamentos

- `GET /api/wallet`
- `GET /api/payment-packages`
- `POST /api/payments`
- `GET /api/payments/history`

### Subscription

- `GET /api/subscription`

### Admin de rodadas

- `GET /api/admin/rounds`
- `POST /api/admin/rounds`
- `POST /api/admin/rounds/:roundId/open`
- `POST /api/admin/rounds/:roundId/result`
- `POST /api/admin/rounds/:roundId/close`

## Páginas legadas identificadas

### `src/pages/AdminPage.tsx`

Problemas:

- usa `fetch` hardcoded
- usa host fixo externo
- consome endpoints fora do padrão atual
- tenta acessar rota de audit que não foi confirmada como ativa

### `src/pages/Ranking.tsx`

Problemas:

- usa `fetch` hardcoded
- usa `/api/ranking` em vez de `/api/rankings/*`
- não participa da arquitetura ativa atual

## Conclusão

O frontend ativo hoje é o conjunto:

- auth por sessão
- dashboard
- ticket
- wallet
- payments
- subscription
- bar
- admin/rounds

O restante deve ser tratado como legado até ser revisado ou removido.
