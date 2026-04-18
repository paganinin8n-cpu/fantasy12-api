# Matriz de Integração API x Frontend

## Objetivo

Mapear o estado real de compatibilidade entre `fantasy12-api` e `fantasy12-frontend` para orientar a Fase 1 de consolidação.

## Legenda

- `OK`: contrato aparenta estar alinhado
- `PARCIAL`: integração existe, mas com inconsistência de implementação
- `GAP`: frontend e backend não batem hoje
- `LEGADO`: fluxo ou tela aparenta ser antiga e fora do padrão atual

## Fluxos principais

| Domínio | Frontend | Backend | Status | Observação |
| --- | --- | --- | --- | --- |
| Login | `POST /auth/login` | `POST /api/auth/login` | OK | `baseURL` do frontend já inclui a API, então o path relativo está compatível com a montagem em `src/index.ts` |
| Logout | `POST /auth/logout` | `POST /api/auth/logout` | OK | Fluxo coerente com sessão baseada em cookie |
| Bootstrap do usuário | `GET /api/me` | `GET /api/me` | OK | Backend protegido por `authMiddleware`; é o contrato certo para bootstrap |
| Ranking mensal no dashboard | `GET /api/rankings/monthly` | `GET /api/rankings/monthly` | OK | Parece ser o fluxo mais alinhado hoje |
| Ticket submit | `POST /api/tickets` | `POST /api/tickets` | PARCIAL | Path bate, mas o controller espera `req.user` e a rota lida não mostrou `authMiddleware` |
| Rodada aberta | `GET /api/rounds/open` | `GET /api/rounds/open` | PARCIAL | Path bate, mas a tela espera `matches` embutidos na resposta; backend também possui rota separada `/rounds/:roundId/matches` |
| Partidas da rodada | sem consumo claro consolidado | `GET /api/rounds/:roundId/matches` | PARCIAL | O frontend parece tentar receber tudo em `/rounds/open`; contrato precisa ser canonizado |
| Subscription | `GET /api/subscription` | `GET /api/subscription` | OK | Contrato alinhado |
| Wallet | `GET /api/wallet` | `GET /api/wallet` | OK | Contrato alinhado |
| Payment packages | `GET /api/payment-packages` | `GET /api/payment-packages` | OK | Há duas definições de rota no backend, mas o path final consumido existe |
| Payment history | `GET /api/payments/history` | `GET /api/payments/history` | OK | Contrato alinhado |
| Criar rodada admin | `POST /api/admin/rounds` | `POST /api/admin/rounds` | OK | Fluxo protegido por auth + autorização |
| Abrir rodada admin | `POST /api/admin/rounds/:roundId/open` | `POST /api/admin/rounds/:roundId/open` | OK | Fluxo protegido |
| Definir resultado admin | `POST /api/admin/rounds/:roundId/result` | `POST /api/admin/rounds/:roundId/result` | OK | Fluxo protegido |
| Fechar rodada admin | `POST /api/admin/rounds/:roundId/close` | `POST /api/admin/rounds/:roundId/close` | OK | Fluxo protegido |
| Listar rodadas admin | `GET /api/admin/rounds` | não encontrado nas rotas lidas | GAP | A tela `AdminRoundPage` depende desse endpoint, mas ele não apareceu no backend inspecionado |
| Ranking page legado | `GET https://.../api/ranking` | não encontrado | LEGADO | Página usa `fetch` hardcoded e endpoint fora do contrato atual `/api/rankings/*` |
| Admin page legado | `GET/POST https://.../admin/rounds*` | não compatível com prefixos atuais | LEGADO | Tela antiga fora da camada `http` e fora do padrão `/api/admin/*` |
| Audit admin legado | `GET https://.../api/admin/audit` | não encontrado nas rotas lidas | GAP | Consumido apenas em tela legada |

## Gaps estruturais encontrados

### 1. Autenticação duplicada no frontend

Arquivos:

- `src/app/AuthProvider.tsx`
- `src/app/auth.tsx`

Impacto:

- risco de divergência de contrato
- estado de sessão duplicado
- páginas consumindo formatos diferentes de contexto

Decisão recomendada:

- manter uma única implementação de auth

### 2. Tela de dashboard ainda carrega resquício de modelo por token

Arquivo:

- `src/pages/Dashboard.tsx`

Impacto:

- incompatibilidade com o modelo atual orientado a sessão

Decisão recomendada:

- remover dependência de `token` do contexto

### 3. Contrato de ticket ainda não está canonizado

Arquivos:

- frontend: `src/pages/Ticket.tsx`, `src/modules/ticket/ticket.service.ts`
- backend: `src/routes/ticket.routes.ts`, `src/controllers/ticket.controller.ts`

Impacto:

- risco funcional de autenticação
- indefinição sobre onde vêm os `matches`

Decisão recomendada:

- definir um contrato oficial para a tela de ticket com payload e resposta claros

### 4. Admin de rodadas está incompleto no backend para a tela nova

Arquivo afetado no frontend:

- `src/pages/AdminRound.tsx`

Impacto:

- a página depende de listagem que não apareceu nas rotas backend analisadas

Decisão recomendada:

- adicionar `GET /api/admin/rounds` ou ajustar a tela para o contrato real

### 5. Existem telas claramente legadas no frontend

Arquivos:

- `src/pages/AdminPage.tsx`
- `src/pages/Ranking.tsx`

Impacto:

- endpoints hardcoded
- bypass da camada HTTP
- alta chance de regressão e confusão na manutenção

Decisão recomendada:

- remover, arquivar ou migrar essas telas para o contrato canônico

## Prioridade recomendada da Fase 1

### Prioridade 1

- unificar auth no frontend
- confirmar e proteger todas as rotas autenticadas do backend
- corrigir fluxo de ticket

### Prioridade 2

- canonizar contratos de rodada e ranking
- decidir destino das telas legadas
- adicionar listagem admin de rodadas ou remover dependência atual

### Prioridade 3

- padronizar tratamento de erro e tipagem de resposta
- reduzir duplicidade de rotas no backend

## Resultado esperado após a Fase 1

Ao fim da consolidação de integração:

- frontend e backend passam a compartilhar um contrato único
- sessão vira o mecanismo oficial sem ambiguidades
- telas legadas deixam de influenciar a arquitetura ativa
- o projeto fica pronto para entrar na criação do `fantasy12-infra` sem carregar inconsistências atuais
