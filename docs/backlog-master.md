# Backlog Mestre

Data de consolidacao:

- 2026-05-15

Ultima atualizacao:

- 2026-05-24

Objetivo:

- manter um unico backlog oficial do Fantasy12
- separar claramente produto, frontend, backend, operacao e seguranca
- usar os outros documentos como insumo de analise, nao como backlogs paralelos

Documentos de origem:

- [`docs/roadmap.md`](/Users/roberson/dev/personal/fantasy12-api/docs/roadmap.md)
- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)
- [`docs/updates-2026-05-18-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-18-review.md)
- [`docs/updates-2026-05-22-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-22-review.md)

## Como ler este backlog

### Prioridades

- `P0`: bloqueia operacao, deploy confiavel ou regra central do produto
- `P1`: muito importante para uso real e maturidade da plataforma
- `P2`: importante para evolucao de UX, produto e operacao
- `P3`: desejavel, mas pode esperar

### Status sugeridos

- `Nao iniciado`
- `Em andamento`
- `Parcial`
- `Concluido`

## P0. Plataforma e producao

### 1. Fechar DNS publico final

Tipo:

- Operacao

Status sugerido:

- `Concluido`

Tarefas:

- apontar `www.fantasy12.com` para `72.60.51.161`
- apontar `api.fantasy12.com` para `72.60.51.161`
- remover conflitos antigos de DNS e IPv6 nao utilizado
- validar `https://www.fantasy12.com/login`
- validar `https://api.fantasy12.com/health`

Nota 2026-05-22:

- dominio publico e healthcheck de producao validados
- frontend publico servindo bundle novo

### 2. Corrigir CORS para homologacao e dominio final

Tipo:

- Backend / Operacao

Status sugerido:

- `Concluido`

Tarefas:

- manter `https://www.fantasy12.com` como origem oficial
- liberar temporariamente `https://f12-prd-frontend.x18arx.easypanel.host` enquanto o DNS estabiliza
- revalidar login, sessao e cookies cross-origin

### 3. Canonizar bootstrap de banco novo

Tipo:

- Backend / Banco

Status sugerido:

- `Em andamento`

Tarefas:

- formalizar estrategia para ambiente novo
- decidir fluxo oficial entre `db push`, migrations e seed
- documentar bootstrap minimo de producao e desenvolvimento
- remover ambiguidade da trilha atual de migrations

### 4. Corrigir estrategia de migrations

Tipo:

- Backend / Banco

Status sugerido:

- `Em andamento`

Tarefas:

- manter baseline fresh canônica versionada
- auditar a trilha histórica e documentar pontos de quebra
- preparar plano de corte para baseline Prisma definitiva
- impedir que migrations historicas quebrem ambiente novo
- definir processo seguro de evolucao de schema

## P1. Regras centrais do produto

### 5. Desacoplar `PRO` de `User.role`

Tipo:

- Backend / Dominio

Status sugerido:

- `Nao iniciado`

Tarefas:

- tratar `ADMIN` como role estrutural
- tratar `PRO` como estado de assinatura
- mover elegibilidade PRO para `Subscription.status`, `Subscription.plan` e vigencia
- revisar servicos que ainda dependem de `user.role = PRO`

### 6. Canonizar beneficios por plano

Tipo:

- Backend / Produto

Status sugerido:

- `Parcial`

Tarefas:

- definir regra oficial FREE
- definir regra oficial PRO mensal
- definir regra oficial PRO anual
- refletir isso no job de abertura de rodada e no consumo de beneficios

Nota 2026-05-22:

- usuario normal recebe 2 duplas gratuitas por rodada
- usuario PRO recebe 4 duplas e 2 super duplas gratuitas por rodada
- beneficios gratuitos continuam nao acumulativos entre rodadas
- consumo de ticket usa primeiro beneficios gratuitos e depois saldo comprado

### 7. Fechar ranking FREE, PRO e boloes premium

Tipo:

- Backend / Produto

Status sugerido:

- `Concluido`

Tarefas:

- revisar separacao real entre ranking global, PRO e bolao
- garantir restricao de bolao premium para `PRO ANNUAL`, se essa for a regra oficial
- garantir inscricao automatica no ranking PRO mensal, se essa regra for mantida

### 8. Revisar payload de perfil e permissao do usuario

Tipo:

- Backend / Frontend

Status sugerido:

- `Concluido`

Tarefas:

- enriquecer `/api/me` com estado funcional do usuario
- preferir `isPro`, `subscriptionPlan` e `adminRoles`
- reduzir dependencia do frontend em `role = PRO`

Nota 2026-05-22:

- `/api/me` agora retorna `nickname`, `phone`, `bio`, `profileImage` e `adminRoles`
- perfil editavel disponivel no frontend ativo

### 9. Decidir sobre login Google

Tipo:

- Produto / Backend / Frontend

Status sugerido:

- `Nao iniciado`

Tarefas:

- decidir se Google login entra agora ou fica para roadmap
- se entrar, modelar OAuth e UX
- se nao entrar, remover mencao como se fosse funcionalidade atual

## P1. Frontend ativo e experiencia principal

### 10. Consolidar fluxo principal de palpites

Tipo:

- Frontend / UX

Status sugerido:

- `Parcial`

Referencia:

- `responsive_match_analysis_picks`

Tarefas:

- refazer a tela de ticket como experiencia mobile-first
- destacar palpite gratis ativo
- destacar duplas e super duplas gratis e pagas
- explicitar progresso da selecao
- melhorar CTA final

### 11. Implementar resumo de palpite antes do envio

Tipo:

- Frontend / UX

Status sugerido:

- `Nao iniciado`

Referencia:

- `responsive_prediction_summary_modal`

Tarefas:

- criar etapa de revisao antes do submit
- destacar selecoes `2x` e `4x`
- confirmar envio com clareza

### 12. Revisar UX da BarPage

Tipo:

- Frontend / Monetizacao

Status sugerido:

- `Parcial`

Referencia:

- `responsive_bar_store_details`

Tarefas:

- preservar pacotes alinhados com a regra comercial de `fichas`
- manter `1 ficha = R$ 0,50` como referencia fixa de valor
- evitar comunicar desconto sobre `fichas`
- continuar melhorando hierarquia dos pacotes
- manter `duplas` e `super duplas` como extras, nao como formacao de preco
- preservar a regra fixa de `4 duplas` e `2 super duplas` por rodada
- continuar melhorando a conexao entre fichas, duplas e super duplas
- continuar aumentando clareza comercial da loja

Nota 2026-05-22:

- `BarPage` recebeu `Menu Tatico` para compra de duplas e super duplas por fichas
- compra de extras independe do usuario ser normal ou PRO
- extras comprados entram no inventario persistente do usuario

### 13. Evoluir tela de perfil

Tipo:

- Frontend / UX

Status sugerido:

- `Parcial`

Referencia:

- `responsive_profile_settings`

Tarefas:

- tornar status PRO mais visivel
- melhorar formulario de perfil
- deixar a gestao de conta mais clara

Nota 2026-05-22:

- formulario de perfil editavel entregue
- ainda resta refinamento visual fino do estado PRO e gestao de conta

### 14. Criar fluxo visual de bolao

Tipo:

- Frontend / Produto

Status sugerido:

- `Concluido`

Referencia:

- `responsive_create_league_modal`

Tarefas:

- criar entrada e criacao de bolao no frontend ativo
- expor regras de premium e assinatura
- organizar datas, custo e observacoes

Nota 2026-05-22:

- `POST /api/boloes` entregue
- criacao visual de bolao para PRO anual entregue no frontend ativo
- backend restringe criacao a assinatura PRO anual ativa

### 15. Simplificar a dashboard do jogador

Tipo:

- Frontend / Produto

Status sugerido:

- `Nao iniciado`

Tarefas:

- eliminar redundancia entre hero superior, `Sua rodada` e `Meu envio atual`
- consolidar `rodada + status + envio` no primeiro bloco
- reduzir cards secundarios para resumo e CTA
- revisar necessidade de botao de retorno ao topo conforme layout final

## P1. Admin operacional

### 16. Consolidar admin de rodadas

Tipo:

- Frontend / Backend

Status sugerido:

- `Parcial`

Referencias:

- `admin_rodadas_management`
- `admin_create_round_form`

Tarefas:

- amadurecer tela de listagem
- amadurecer criacao/edicao de rodadas
- refletir estados `DRAFT`, `OPEN`, `CLOSED`, `SCORED`

### 17. Consolidar admin de usuarios

Tipo:

- Frontend / Backend

Status sugerido:

- `Parcial`

Referencia:

- `admin_user_management`

Tarefas:

- expor tela ativa para gestao de usuarios
- permitir ajuste operacional de coins e beneficios
- alinhar com o modelo final de assinatura e roles

Nota 2026-05-22:

- `GET /api/admin/users` entregue e protegido por permissao admin
- tela `Admin > Usuarios` entregue no frontend ativo
- ajuste operacional de coins e beneficios continua pendente

### 18. Consolidar logs operacionais no admin

Tipo:

- Frontend / Backend / Operacao

Status sugerido:

- `Parcial`

Referencia:

- `admin_system_logs`

Tarefas:

- definir fonte de logs visiveis
- criar filtros uteis para operacao
- expor trilha auditavel de eventos relevantes

Nota 2026-05-22:

- `GET /api/admin/logs` entregue e protegido por permissao admin
- tela `Admin > Logs` entregue no frontend ativo
- filtros e rotina operacional de uso dos logs ainda podem amadurecer

## P2. Qualidade, seguranca e operacao

### 19. Endurecer jobs internos, webhooks e auditoria

Tipo:

- Backend / Seguranca

Status sugerido:

- `Parcial`

Tarefas:

- revisar protecao de jobs internos
- amadurecer trilha auditavel
- revisar idempotencia e rastreabilidade de webhooks

### 20. Fechar observabilidade minima

Tipo:

- Infra / Operacao

Status sugerido:

- `Nao iniciado`

Tarefas:

- logs estruturados
- healthchecks uteis
- checklist de incidente
- visibilidade minima para pagamentos e jobs

### 21. Definir rotina de backup e restore

Tipo:

- Banco / Operacao

Status sugerido:

- `Nao iniciado`

Tarefas:

- definir backup do Postgres
- definir restore testado
- documentar operacao

## P2. Arquitetura de frontend

### 22. Criar mini design system do Fantasy12

Tipo:

- Frontend / UX

Status sugerido:

- `Nao iniciado`

Tarefas:

- tokens de cor
- padroes de card
- padroes de status e badge
- padroes de CTA
- padroes de modal
- padroes de footer fixo mobile

### 23. Remover ou arquivar definitivamente telas legadas

Tipo:

- Frontend

Status sugerido:

- `Concluido`

Tarefas:

- revisar telas antigas fora do fluxo ativo
- remover `fetch` hardcoded restante
- evitar duplicidade de UX e contrato

Nota 2026-05-22:

- pagina orfa `src/pages/Ranking.tsx` removida do frontend
- `AdminPage.tsx` legado ja nao existe no frontend atual
- nao ha `fetch` hardcoded restante em `src`
- rota `/betting` permanece apenas como redirecionamento compatível para `/ticket`

## P3. Assinaturas e expansao controlada

### 24. Revisar planos e precificacao de assinatura

Tipo:

- Produto / Backend / Frontend / Pagamentos

Status sugerido:

- `Parcial`

Tarefas:

- validar regra comercial de PRO mensal por R$ 24,90
- validar regra comercial de PRO anual em 12x de R$ 9,90
- validar PIX anual por R$ 99,00 com comunicacao "paga 10 meses e ganha 12"
- alinhar pacotes e gateway antes de expor como fluxo financeiro final

Nota 2026-05-24:

- catalogo canonico de planos exposto em `GET /api/subscription/plans`
- frontend de assinatura mostra PRO mensal, PRO anual no cartao e PRO anual no PIX
- contrato de `GET /api/subscription` alinhado no frontend para usar `isPro`, `isAnnualPro` e `subscription`
- checkout/ativacao automatica da assinatura segue pendente antes de liberar compra real

### 25. Refinar experiencia premium

Tipo:

- Produto / Frontend / Backend

Status sugerido:

- `Nao iniciado`

Tarefas:

- destacar valor do PRO
- diferenciar mensal e anual
- preparar eventos exclusivos e beneficios premium

### 26. Automatizar CI/CD completo

Tipo:

- Infra / Operacao

Status sugerido:

- `Parcial`

Tarefas:

- pipeline de build
- pipeline de deploy
- padrao de release

## Ordem recomendada agora

1. conectar checkout/ativacao de assinatura aos planos ja canonizados
2. observabilidade minima, checklist de incidente e visibilidade de jobs/pagamentos
3. rotina documentada e testada de backup e restore
4. concluir desacoplamento conceitual de `PRO` de `User.role`
5. refinamentos do fluxo principal do jogador, bar e dashboard
6. amadurecer administracao operacional de usuarios, logs e beneficios

## Observacao final

Os documentos abaixo continuam valiosos, mas agora devem ser lidos como analise de suporte:

- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)
- [`docs/updates-2026-05-21-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-21-review.md)

A fonte oficial de prioridades passa a ser este arquivo.
