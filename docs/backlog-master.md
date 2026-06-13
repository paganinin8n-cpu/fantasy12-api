# Backlog Mestre

Data de consolidacao:

- 2026-05-15

Ultima atualizacao:

- 2026-06-11

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

- `Concluido`

Tarefas:

- formalizar estrategia para ambiente novo
- decidir fluxo oficial entre `db push`, migrations e seed
- documentar bootstrap minimo de producao e desenvolvimento
- remover ambiguidade da trilha atual de migrations

Nota 2026-06-06:

- fluxo oficial de banco vazio consolidado em `npm run prisma:bootstrap:fresh`
- bootstrap bloqueia banco nao vazio por padrao
- bootstrap aplica `prisma db push`, marca migrations historicas como aplicadas e executa seeds minimas
- `npm run prisma:migration:policy:check` passa a validar que essa politica continua preservada

### 4. Corrigir estrategia de migrations

Tipo:

- Backend / Banco

Status sugerido:

- `Concluido`

Tarefas:

- manter baseline fresh canônica versionada
- auditar a trilha histórica e documentar pontos de quebra
- preparar plano de corte para baseline Prisma definitiva
- impedir que migrations historicas quebrem ambiente novo
- definir processo seguro de evolucao de schema

Nota 2026-06-06:

- baseline fresh canonica permanece versionada em `prisma/baselines/current-fresh-schema.sql`
- cadeia historica fica congelada como legado auditado
- ambientes fresh deixam de executar a cadeia quebrada e passam a registra-la como aplicada depois do `db push`
- releases de schema passam por `npm run prisma:schema:release:check`, incluindo auditoria, baseline, politica de migrations e build

## P1. Regras centrais do produto

### 5. Desacoplar `PRO` de `User.role`

Tipo:

- Backend / Dominio

Status sugerido:

- `Concluido`

Tarefas:

- tratar `ADMIN` como role estrutural
- tratar `PRO` como estado de assinatura
- mover elegibilidade PRO para `Subscription.status`, `Subscription.plan` e vigencia
- revisar servicos que ainda dependem de `user.role = PRO`

Nota 2026-06-04:

- elegibilidade PRO em runtime passa a depender da assinatura ativa, nao de `User.role`
- concessao de beneficios por rodada usa apenas `Subscription`
- ajuste/cancelamento administrativo de assinatura nao altera mais o papel estrutural do usuario
- enum legado `UserRole.PRO` ainda existe no schema e nos contratos para limpeza futura com migracao planejada

Nota 2026-06-06:

- dependencias funcionais restantes de `user.role = PRO` foram removidas dos fluxos de beneficios e scripts operacionais
- `npm run product:rules:check` passa a impedir uso de `User.role` como fonte de elegibilidade PRO fora da camada estrutural/compatibilidade
- `UserRole.PRO` permanece apenas como legado de schema/contrato para migracao futura, nao como regra de negocio ativa

### 6. Canonizar beneficios por plano

Tipo:

- Backend / Produto

Status sugerido:

- `Concluido`

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

Nota 2026-05-31:

- regra da planilha incorporada ao backlog: rankings de bolao usam a janela propria do ranking, somando `scoreRound` das rodadas dentro de `startDate` e `endDate`
- `scoreInitial` permanece como marco auditavel do acumulado global antes do inicio, mas a pontuacao exibida do bolao vem do desempenho dentro da janela

Nota 2026-06-06:

- regra oficial de beneficios por rodada centralizada em `ROUND_BENEFIT_GRANTS`
- FREE recebe 2 duplas e 0 super duplas
- PRO mensal recebe 4 duplas e 2 super duplas
- PRO anual recebe 4 duplas e 2 super duplas
- concessao e reprocessamento de beneficios usam assinatura ativa como fonte unica de elegibilidade PRO

Nota 2026-06-08:

- consumo de ticket passou a auditar a origem de cada multiplicador usado
- auditoria registra quantos beneficios vieram do saldo gratis da rodada e quantos vieram do inventario comprado

### 7. Fechar ranking FREE, PRO e boloes premium

Tipo:

- Backend / Produto

Status sugerido:

- `Concluido`

Tarefas:

- revisar separacao real entre ranking global, PRO e bolao
- garantir restricao de bolao premium para `PRO ANNUAL`, se essa for a regra oficial
- garantir inscricao automatica no ranking PRO mensal, se essa regra for mantida

Nota 2026-06-06:

- dashboard mensal filtra ranking PRO por assinatura ativa
- Mesas premium continuam restritas a assinatura PRO anual ativa para criacao
- ranking de Mesa usa janela propria em `RankingWindowScoreService`
- a pontuacao da Mesa segue a regra da planilha: `scoreTotalCurrent - scoreInitial`
- `scoreInitial` fica preservado como marco auditavel do acumulado antes da ativacao da Mesa
- a regra protege contra valor negativo quando o baseline supera o total corrente

Nota 2026-06-08:

- implementado teste automatizado para a regra `scoreTotalCurrent - scoreInitial`
- recalculo e fechamento de ranking registram auditoria quando score ou posicao mudam
- criacao manual de ranking e adicao manual de participante agora registram baseline e auditoria

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

- `Implementado localmente em 2026-06-11`

Tarefas:

- decidir se Google login entra agora ou fica para roadmap
- se entrar, modelar OAuth e UX
- se nao entrar, remover mencao como se fosse funcionalidade atual

## P1. Frontend ativo e experiencia principal

### 10. Consolidar fluxo principal de palpites

Tipo:

- Frontend / UX

Status sugerido:

- `Concluido`

Referencia:

- `responsive_match_analysis_picks`

Tarefas:

- refazer a tela de ticket como experiencia mobile-first
- destacar palpite gratis ativo
- destacar duplas e super duplas gratis e pagas
- explicitar progresso da selecao
- melhorar CTA final

Nota 2026-06-06:

- fluxo de ticket consolidado com progresso 12/12, saldo tatico e separacao entre multiplicadores gratis e comprados
- resumo lateral passa a destacar duplas, super duplas, fichas e proximo passo
- CTA final conduz para conferencia antes do envio definitivo

### 11. Implementar resumo de palpite antes do envio

Tipo:

- Frontend / UX

Status sugerido:

- `Concluido`

Referencia:

- `responsive_prediction_summary_modal`

Tarefas:

- criar etapa de revisao antes do submit
- destacar selecoes `2x` e `4x`
- confirmar envio com clareza

Nota 2026-06-06:

- modal `TicketPreviewModal` virou etapa de conferencia final antes do envio
- revisao mostra os 12 jogos, selecao marcada, uso de `2x` e `4x`, e consumo gratis/comprado
- botao de envio fica bloqueado para tickets ja enviados e comunica que a confirmacao e definitiva

### 12. Revisar UX da BarPage

Tipo:

- Frontend / Monetizacao

Status sugerido:

- `Concluido`

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

Nota 2026-06-06:

- BarPage reorganizada em saldo, Menu Tatico e compra de fichas
- compra de fichas comunica referencia fixa de `1 ficha = R$ 0,50` sem linguagem de desconto
- extras ficam claramente separados da compra de fichas e preservam inventario persistente

### 13. Evoluir tela de perfil

Tipo:

- Frontend / UX

Status sugerido:

- `Concluido`

Referencia:

- `responsive_profile_settings`

Tarefas:

- tornar status PRO mais visivel
- melhorar formulario de perfil
- deixar a gestao de conta mais clara
- permitir troca de senha pelo proprio usuario logado
- validar senha atual, nova senha e confirmacao no frontend
- exibir feedback claro sem encerrar sessao automaticamente

Nota 2026-05-22:

- formulario de perfil editavel entregue
- ainda resta refinamento visual fino do estado PRO e gestao de conta

Nota 2026-05-31:

- backend ja dispoe de `POST /api/me/password`
- perfil ativo do frontend ja expoe troca de senha com validacao de senha atual, nova senha e confirmacao

Nota 2026-06-06:

- perfil recebeu bloco dedicado de status PRO, vigencia e beneficios de conta
- gestao de assinatura, carteira, palpites, mesas, senha e saida ficou mais explicita

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

- `Concluido`

Tarefas:

- eliminar redundancia entre hero superior, `Sua rodada` e `Meu envio atual`
- consolidar `rodada + status + envio` no primeiro bloco
- reduzir cards secundarios para resumo e CTA
- revisar necessidade de botao de retorno ao topo conforme layout final

Nota 2026-06-06:

- hero passou a concentrar rodada, status, envio e CTAs principais
- bloco redundante de rodada ativa foi removido da sequencia do dashboard
- resumos secundarios ficaram focados em palpites, ranking, Bar e Mesas

## P1. Admin operacional

### 16. Consolidar admin de rodadas

Tipo:

- Frontend / Backend

Status sugerido:

- `Concluido`

Referencias:

- `admin_rodadas_management`
- `admin_create_round_form`

Tarefas:

- criar rodada com exatamente 12 jogos cadastrados
- editar datas e jogos enquanto a rodada esta em `DRAFT`
- refletir estados `DRAFT`, `OPEN`, `CLOSED`, `SCORED`
- lancar resultado por jogo com selecao `Casa`, `Empate` e `Fora`
- fechar e apurar rodada usando o motor automatico de pontuacao existente

### 17. Consolidar admin de usuarios

Tipo:

- Frontend / Backend

Status sugerido:

- `Parcial`

Referencia:

- `admin_user_management`

Tarefas:

- expor tela ativa para gestao de usuarios
- listar por padrao os usuarios mais recentes cadastrados
- permitir pesquisa por nome, email e apelido para operacao em bases grandes
- paginar resultados de usuarios no backend e frontend
- permitir ajuste operacional de coins e beneficios
- alinhar com o modelo final de assinatura e roles
- permitir bloqueio administrativo de usuario com motivo
- permitir liberacao administrativa de usuario bloqueado
- permitir ajuste manual de plano pago com vigencia
- permitir cancelamento manual de plano com auditoria
- exibir historico administrativo relevante por usuario
- tornar permissoes admin granulares para acoes sensiveis

Nota 2026-05-22:

- `GET /api/admin/users` entregue e protegido por permissao admin
- tela `Admin > Usuarios` entregue no frontend ativo
- ajuste operacional de coins e beneficios continua pendente

Nota 2026-05-31:

- prioridade nova: transformar admin em gestor operacional do sistema
- acoes sensiveis devem gerar `AdminAuditLog` com admin, alvo, payload, IP e motivo
- bloqueio administrativo deve ser separado do bloqueio temporario de login por brute force

Nota 2026-06-06:

- tela `Admin > Usuarios` exibe historico auditavel por usuario
- ajuste de beneficios taticos foi separado de credito de carteira
- beneficios pagos entram em `UserBenefitInventory`; beneficios gratis exigem rodada
- bloqueio, liberacao e plano usam permissoes mais granulares (`USER_BLOCK`, `USER_UNBLOCK`, `USER_PLAN_WRITE`)

Nota 2026-06-11:

- referencia visual nova: grade operacional com usuario, papel/plano, fichas, duplas e super duplas em linhas editaveis
- backend de `GET /api/admin/users` ja suporta `page`, `limit`, `q/query` e ordenacao por `createdAt desc`
- pendente no frontend: expor controles de paginacao, preservar busca entre paginas e trocar a experiencia de lista/detalhe por uma grade operacional ou modo hibrido
- pesquisa deve ser requisito de primeira linha, pois a gestao com milhares de usuarios fica impraticavel sem filtro server-side
- paginacao deve ser server-side, com limite padrao conservador e opcao de navegar pagina anterior/proxima
- ajustes rapidos de fichas, duplas e super duplas devem continuar auditaveis e exigir motivo quando alterarem saldo de forma administrativa

### 18. Consolidar logs operacionais no admin

Tipo:

- Frontend / Backend / Operacao

Status sugerido:

- `Concluido`

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

Nota 2026-05-25:

- painel `Admin > Operação` entregue para sinais agregados de pagamentos, webhooks, assinaturas e configuração crítica
- `GET /api/admin/operational/status` entregue e protegido por permissão de auditoria

Nota 2026-06-06:

- `GET /api/admin/logs` recebeu filtros de fonte, entidade, entityId, acao, ator e limite
- tela `Admin > Logs` recebeu filtros operacionais, contadores e horario da ultima carga
- historico de usuario reaproveita a mesma trilha de auditoria para investigacao por alvo

## P2. Qualidade, seguranca e operacao

### 19. Endurecer jobs internos, webhooks e auditoria

Tipo:

- Backend / Seguranca

Status sugerido:

- `Concluido`

Tarefas:

- revisar protecao de jobs internos
- amadurecer trilha auditavel
- revisar idempotencia e rastreabilidade de webhooks

Nota 2026-06-06:

- jobs internos usam middleware `internalJobAuth` de forma consistente
- execucoes internas passam por `InternalJobRunnerService` com `RUNNING`, `SUCCESS`, `FAILED` e hit idempotente
- jobs de rodada, abertura, rankings expirados, revalidacao de assinaturas e alertas ganharam rastreabilidade
- webhook Mercado Pago manteve criacao race-safe por evento unico e rastreamento em `payment_webhook_events`

Nota 2026-06-08:

- pagamentos, webhooks, compras de beneficios, convites de Mesa, entrada em Mesa, ativacao de Mesa, captura de baseline, envio de ticket e recalculo de ranking receberam auditoria de dominio persistida
- rotas de pagamento passaram a declarar `authMiddleware` explicitamente
- cadastro, compra de beneficios, checkout/cancelamento de assinatura, webhooks e jobs internos receberam rate limit por categoria
- variaveis `RATE_LIMIT_WEBHOOK_MAX` e `RATE_LIMIT_INTERNAL_JOB_MAX` foram documentadas em `.env.example`

### 20. Fechar observabilidade minima

Tipo:

- Infra / Operacao

Status sugerido:

- `Concluido`

Tarefas:

- logs estruturados
- healthchecks uteis
- checklist de incidente
- visibilidade minima para pagamentos e jobs

Nota 2026-05-25:

- `/health` agora valida conexão com banco antes de retornar `db: ok`
- `GET /api/admin/operational/status` consolida sinais mínimos de operação
- frontend recebeu `Admin > Operação` com status geral, configuração Mercado Pago, pagamentos, webhooks, assinaturas e rodada aberta
- ainda falta rotina externa de alerta/notificação e runbook de incidente testado

Nota 2026-06-06:

- anomalias podem ser enviadas para webhook externo via `OPERATIONS_ALERT_WEBHOOK_URL`
- `GET /api/admin/operational/status` inclui jobs, alerta externo configurado e runbook rapido
- `POST /internal/jobs/alerts/run` executa rotina de alertas com protecao e rastreabilidade
- `docs/operational-runbook.md` documenta teste de incidente e checklist de verificacao

### 21. Definir rotina de backup e restore

Tipo:

- Banco / Operacao

Status sugerido:

- `Concluido`

Tarefas:

- definir backup do Postgres
- definir restore testado
- documentar operacao

Nota 2026-06-07:

- `npm run db:backup` cria dump Postgres custom com checksum SHA-256 e manifest
- `npm run db:backup:verify` valida arquivo, manifest e leitura via `pg_restore --list`
- `npm run db:restore` restaura em URL alvo explicita, com dry-run e protecao contra uso acidental da `DATABASE_URL`
- `.env.example` documenta `BACKUP_DIR`, `BACKUP_RETENTION`, `BACKUP_UPLOAD_COMMAND` e `RESTORE_DATABASE_URL`
- `docs/database-backup-restore.md` define politica inicial, agendamento, restore testado e checklists

## P2. Arquitetura de frontend

### 22. Criar mini design system do Fantasy12

Tipo:

- Frontend / UX

Status sugerido:

- `Concluido`

Tarefas:

- tokens de cor
- padroes de card
- padroes de status e badge
- padroes de CTA
- padroes de modal
- padroes de footer fixo mobile

Nota 2026-06-07:

- frontend recebeu mini design system em `src/components/ds`
- tokens de pagina, superficie, texto e controles foram centralizados
- componentes base criados: `PageShell`, `PageHero`, `Card`, `Panel`, `MetricCard`, `StatusBadge`, `Notice`, `Button`, `TextInput`, `SelectInput`, `EmptyState`, `LoadingState`
- telas migradas parcialmente: Dashboard, Profile, AdminUsers, AdminLogs e AdminOperations
- documentacao criada em `docs/mini-design-system.md` no repositorio frontend

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
- `POST /api/subscription/checkout` cria checkout Mercado Pago para os planos PRO
- frontend redireciona para o checkout e volta com status `success`, `pending` ou `failure`
- webhook de pagamento aprovado renova/ativa assinatura via `metadata.plan`
- ainda falta teste real de pagamento de assinatura em producao antes de considerar o fluxo financeiro fechado

### 25. Refinar experiencia premium

Tipo:

- Produto / Frontend / Backend

Status sugerido:

- `Implementado localmente em 2026-06-11`

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

## P1. UX responsiva e separacao visual sem regressao funcional

Principio desta frente:

- as melhorias abaixo sao de organizacao visual, responsividade e clareza de fluxo
- nao alterar regra de negocio, contratos de API, calculos, auditoria ou permissoes sem item tecnico separado
- preservar rotas existentes e comportamento funcional ja validado
- cada entrega deve ser validada em desktop e mobile antes de deploy
- quando houver risco de mudanca funcional, abrir tarefa separada de backend/produto antes de implementar

### 27. Reorganizar Admin > Rodadas por tarefa

Tipo:

- Frontend / UX Admin

Status sugerido:

- `Implementado localmente em 2026-06-12`

Objetivo:

- reduzir poluicao da tela de rodadas separando criacao, operacao da rodada ativa e historico

Tarefas:

- separar visualmente `Rodada ativa` de `Criar nova rodada`
- mover rodadas encerradas, apuradas, canceladas ou em rascunho para area de `Historico de rodadas`
- manter os fluxos existentes de criar, editar jogos, abrir, fechar, lancar resultado e apurar
- preservar a exigencia de 12 jogos por rodada
- manter estados internos atuais (`DRAFT`, `OPEN`, `CLOSED`, `SCORED`, `CANCELLED`), mas exibir labels em portugues
- no mobile, transformar criacao/edicao em fluxo vertical com secoes curtas
- evitar cards competindo entre si; usar blocos e divisorias por tarefa

Critérios de aceite:

- admin entende rapidamente qual rodada esta ativa
- criacao de rodada nao disputa espaco com historico
- nenhuma regra de apuracao ou criacao e alterada
- resultado e apuracao seguem funcionando como antes

### 28. Reorganizar Admin > Usuarios com detalhe progressivo

Tipo:

- Frontend / UX Admin

Status sugerido:

- `Implementado localmente em 2026-06-12`

Objetivo:

- preservar a grade operacional de usuarios, mas reduzir excesso visual no detalhe inferior

Tarefas:

- manter busca, paginacao e ordenacao por usuarios recentes
- manter colunas operacionais de plano, fichas, duplas, super duplas e status
- substituir o conjunto de muitos cards inferiores por detalhe progressivo
- no desktop, abrir detalhe em painel lateral ou area dedicada com abas
- no mobile, abrir detalhe em tela/drawer full-screen
- organizar detalhes em abas: `Resumo`, `Acesso`, `Plano`, `Fichas e beneficios`, `Historico`
- manter ajustes rapidos auditaveis e com motivo
- manter bloqueio, liberacao, plano manual, debito/credito e historico funcionando
- traduzir qualquer status tecnico visivel para portugues

Critérios de aceite:

- tabela continua eficiente para muitos usuarios
- detalhe nao aparece todo de uma vez
- admin consegue executar as mesmas acoes atuais
- historico e auditoria seguem visiveis quando solicitados

### 29. Revisar Dashboard do jogador como tela de decisao rapida

Tipo:

- Frontend / UX Jogador

Status sugerido:

- `Implementado localmente em 2026-06-12`

Objetivo:

- fazer a primeira tela responder rapidamente o que o jogador deve fazer agora

Tarefas:

- destacar o estado principal: rodada aberta, palpite enviado, rodada fechada ou sem rodada ativa
- exibir CTA principal conforme estado: `Fazer palpites`, `Ver meus palpites`, `Acompanhar ranking` ou `Ir ao Bar`
- reduzir resumos redundantes
- deixar fichas, duplas e super duplas como indicadores secundarios, nao como excesso de cards
- melhorar hierarquia mobile-first
- preservar links e rotas atuais

Critérios de aceite:

- usuario identifica o proximo passo em ate poucos segundos
- nenhuma chamada de API ou regra de rodada muda
- dashboard continua levando para palpites, historico, Bar e Mesas

### 30. Polir fluxo de palpites sem alterar motor de jogo

Tipo:

- Frontend / UX Jogador

Status sugerido:

- `Implementado localmente em 2026-06-12`

Objetivo:

- reduzir ruído visual na tela mais importante do jogador preservando regras atuais

Tarefas:

- manter 12 jogos e progresso claro
- preservar regras de dupla e super dupla, incluindo consumo gratis/comprado
- manter modal de revisao antes do envio
- simplificar visual dos jogos no mobile
- deixar CTA final fixo ou facilmente acessivel quando todos os palpites estiverem prontos
- reforcar pontuacao esperada e multiplicadores sem virar texto explicativo longo

Critérios de aceite:

- envio de ticket continua igual tecnicamente
- consumo de duplas/super duplas segue auditavel e correto
- mobile nao exige rolagem confusa para concluir a rodada

### 31. Reorganizar Meus palpites e historico do jogador

Tipo:

- Frontend / UX Jogador

Status sugerido:

- `Implementado localmente em 2026-06-12`

Objetivo:

- deixar historico mais limpo e legivel, principalmente no celular

Tarefas:

- exibir por rodada: pontuacao, acertos, duplas acertadas, super duplas acertadas e status em portugues
- esconder detalhes dos 12 jogos em acordeao/expandir
- separar palpite enviado, resultado oficial e criterios de desempate
- remover termos internos como `SCORED`, `OPEN`, `CLOSED` da interface final
- preservar dados e calculos existentes

Critérios de aceite:

- jogador entende por que pontuou
- desempate por duplas/super duplas fica claro
- tela nao vira uma lista extensa de informacoes sempre abertas

### 32. Revisar Bar/Balcao como hub do jogador

Tipo:

- Frontend / UX Jogador / Monetizacao

Status sugerido:

- `Implementado localmente em 2026-06-13`

Objetivo:

- fazer o Bar parecer uma area viva do produto, nao apenas uma loja

Tarefas:

- separar saldo, compra de fichas, compra de duplas/super e atalhos de jogo
- manter regra comercial atual de fichas e extras
- reduzir excesso de cards e repeticao
- reforcar linguagem de Bar/Balcao quando fizer sentido para o negocio
- garantir que usuario normal e PRO vejam opcoes permitidas sem confusao

Critérios de aceite:

- compra continua funcionando como hoje
- usuario entende diferenca entre fichas, duplas e super duplas
- layout mobile fica claro e escaneavel

### 33. Revisar Mesas como experiencia social/gamificada

Tipo:

- Frontend / UX Jogador / Produto

Status sugerido:

- `Implementado localmente em 2026-06-13`

Objetivo:

- simplificar criacao, entrada e acompanhamento de Mesas sem mudar regras atuais

Tarefas:

- organizar lista de Mesas com estado, participantes, custo e periodo
- transformar criacao de Mesa em fluxo guiado
- destacar convite/link/codigo quando aplicavel
- no detalhe da Mesa, separar `Ranking`, `Participantes`, `Regras` e `Historico`
- manter regras atuais de PRO, custo de entrada e janelas de ranking

Critérios de aceite:

- usuario entende como criar ou entrar em uma Mesa
- regra de elegibilidade e cobranca continua igual
- detalhe da Mesa nao concentra informacao demais em uma unica dobra

### 34. Revisar Perfil, assinatura e conta

Tipo:

- Frontend / UX Jogador

Status sugerido:

- `Implementado localmente em 2026-06-13`

Objetivo:

- reduzir poluicao visual no perfil e deixar conta/seguranca/assinatura mais previsiveis

Tarefas:

- separar visualmente `Dados pessoais`, `Seguranca`, `Assinatura`, `Pagamentos` e `Sair da conta`
- reduzir cards em excesso; usar abas ou secoes simples
- manter troca de senha exigindo senha atual
- manter fluxo de assinatura e pagamento como ja existe
- destacar status PRO sem competir com formulario de perfil

Critérios de aceite:

- perfil nao tem labels sobrepostos ou campos desalinhados
- troca de senha segue segura
- assinatura e dados de conta continuam acessiveis

### 35. Criar checklist de regressao visual e funcional mobile-first

Tipo:

- Frontend / QA

Status sugerido:

- `Nao iniciado`

Objetivo:

- garantir que melhorias visuais nao quebrem fluxos ja entregues

Tarefas:

- criar checklist por tela: Dashboard, Palpites, Historico, Bar, Mesas, Perfil, Admin Rodadas e Admin Usuarios
- validar breakpoints mobile, tablet e desktop
- validar que botoes principais continuam visiveis e acionaveis
- validar que status aparecem em portugues
- validar que formularios nao quebram labels/campos
- validar fluxos criticos: login, palpite, envio, compra, perfil, admin rodada, admin usuario
- registrar screenshots de antes/depois para decisoes de produto

Critérios de aceite:

- cada refatoracao visual vem acompanhada de verificacao minima
- nenhum fluxo funcional validado anteriormente e removido sem decisao explicita
- bugs visuais de sobreposicao/quebra viram correcoes antes de deploy

## Ordem recomendada agora

1. reorganizar `Admin > Rodadas` por tarefa, sem mudar regras
2. reorganizar `Admin > Usuarios` com detalhe progressivo, mantendo a grade operacional
3. revisar Dashboard do jogador como tela de decisao rapida
4. polir fluxo de palpites e historico sem alterar motor de pontuacao
5. revisar Bar/Balcao, Mesas e Perfil com foco mobile-first
6. validar pagamento real de assinatura em producao e webhook de confirmacao
7. manter rotina de observabilidade, backup e deploy como base operacional

## Observacao final

Os documentos abaixo continuam valiosos, mas agora devem ser lidos como analise de suporte:

- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)
- [`docs/updates-2026-05-21-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-21-review.md)

A fonte oficial de prioridades passa a ser este arquivo.
