# Arquitetura Atual

## Repositórios analisados

- `fantasy12-api`: backend principal
- `fantasy12-frontend`: frontend web

## Estado atual do backend

Stack principal:

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- `express-session` para autenticação baseada em cookie

Ponto de entrada:

- `src/index.ts`

Organização observada:

- `controllers/`: camada HTTP
- `services/`: regra de negócio
- `repositories/`: acesso a dados em partes específicas
- `routes/`: composição de rotas
- `middleware/`: autenticação, autorização e tratamento de erro
- `prisma/`: schema, migrations e seeds

## Domínio já modelado no banco

O banco não está em fase inicial. O schema Prisma já cobre:

- usuários e perfis
- rodadas
- tickets/palpites
- score por rodada e histórico
- rankings globais, periódicos e bolões
- convites de bolão
- assinatura recorrente
- carteira e razão financeira
- pacotes de pagamento
- pagamentos e eventos de webhook
- benefícios por rodada e inventário de benefícios
- papéis, permissões e auditoria administrativa
- jobs internos, locks e feature flags

Artefatos encontrados:

- `prisma/schema.prisma`
- migrations versionadas em `prisma/migrations`
- `prisma/seed.js`
- `prisma/seed-admin-permissions.js`

Conclusão:

- a modelagem lógica do banco já existe
- o foco daqui para frente deve ser operação, governança, consistência de migrations e ambientes

## Rotas e fluxos principais do backend

Rotas públicas e autenticadas:

- autenticação por sessão em `/api/auth/login` e `/api/auth/logout`
- perfil autenticado em `/api/me`
- tickets em `/api/tickets`
- rankings em `/api/rankings/*`
- rodada aberta em `/api/rounds/open`

Rotas administrativas:

- criação, abertura, fechamento e definição de resultado de rodadas
- monetização e assinaturas admin
- autorização baseada em permissões

Rotas internas:

- jobs internos para abertura de rodada, score e fechamento de rankings
- webhook do Mercado Pago

## Estado atual do frontend

Stack principal:

- React 19
- Vite
- TypeScript
- React Router 7
- Tailwind CSS 4
- Axios

Pontos de entrada:

- `src/main.tsx`
- `src/app/router.tsx`
- `src/app/http.ts`

Organização observada:

- `pages/`: telas
- `modules/`: serviços e componentes por domínio
- `components/`: elementos compartilhados
- `shared/`: contratos e utilitários
- `app/`: auth, roteamento e camada HTTP

## Integração atual entre frontend e backend

A intenção arquitetural está relativamente clara:

- frontend usa `withCredentials`
- backend usa sessão via cookie
- bootstrap do usuário via `/api/me`
- autenticação deveria ser resolvida no backend

Esse modelo é bom para o estágio atual, mas a implementação ainda está inconsistente.

## Gaps e desalinhamentos encontrados

### Autenticação duplicada no frontend

Existem duas implementações concorrentes:

- `src/app/AuthProvider.tsx`
- `src/app/auth.tsx`

Isso gera divergência de contrato e aumenta risco de bugs de sessão.

### Contratos de API não totalmente alinhados

Exemplos observados:

- frontend chama `/api/rounds/current`, mas o backend expõe `/api/rounds/open`
- frontend chama `/api/rounds/history`, mas essa rota não apareceu no backend lido
- frontend chama `/api/tickets/current`, mas essa rota não apareceu no backend lido
- ainda há chamadas `fetch` hardcoded em algumas páginas em vez da camada HTTP central

### Inconsistência de implementação no frontend

Exemplos observados:

- `Dashboard.tsx` usa `token` no contexto, mas o contexto atual está orientado a sessão
- `TicketPage.tsx` chama `TicketService.createTicket`, mas o service lido expõe outro contrato
- há partes mais modernas convivendo com código legado

### Proteção de rotas incompleta ou inconsistente

Exemplo observado:

- `TicketController` espera `req.user`, mas a rota `POST /api/tickets` não mostrou `authMiddleware` aplicado no arquivo lido

Isso indica risco funcional e de segurança.

## Maturidade operacional atual

Pontos positivos:

- schema Prisma robusto
- migrations já existentes
- separação razoável por domínio no backend
- autenticação por sessão já em andamento
- camada admin e auditoria já pensadas

Lacunas principais:

- ausência de documentação estruturada
- ausência de repositório dedicado de infraestrutura
- contratos backend/frontend ainda não canonizados
- falta de padrão operacional explícito para ambientes
- segurança precisa de hardening antes de produção madura

## Diagnóstico resumido

O Fantasy12 já tem base de produto e de domínio suficientemente rica para entrar em uma fase de consolidação. O maior risco hoje não é falta de funcionalidade, e sim inconsistência entre camadas, ausência de governança operacional e segurança ainda parcial.
