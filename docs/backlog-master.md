# Backlog Mestre

Data de consolidacao:

- 2026-05-15

Objetivo:

- manter um unico backlog oficial do Fantasy12
- separar claramente produto, frontend, backend, operacao e seguranca
- usar os outros documentos como insumo de analise, nao como backlogs paralelos

Documentos de origem:

- [`docs/roadmap.md`](/Users/roberson/dev/personal/fantasy12-api/docs/roadmap.md)
- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)

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

- `Em andamento`

Tarefas:

- apontar `www.fantasy12.com` para `72.60.51.161`
- apontar `api.fantasy12.com` para `72.60.51.161`
- remover conflitos antigos de DNS e IPv6 nao utilizado
- validar `https://www.fantasy12.com/login`
- validar `https://api.fantasy12.com/health`

### 2. Corrigir CORS para homologacao e dominio final

Tipo:

- Backend / Operacao

Status sugerido:

- `Parcial`

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

- `Nao iniciado`

Tarefas:

- criar baseline real para banco vazio
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

### 7. Fechar ranking FREE, PRO e boloes premium

Tipo:

- Backend / Produto

Status sugerido:

- `Parcial`

Tarefas:

- revisar separacao real entre ranking global, PRO e bolao
- garantir restricao de bolao premium para `PRO ANNUAL`, se essa for a regra oficial
- garantir inscricao automatica no ranking PRO mensal, se essa regra for mantida

### 8. Revisar payload de perfil e permissao do usuario

Tipo:

- Backend / Frontend

Status sugerido:

- `Nao iniciado`

Tarefas:

- enriquecer `/api/me` com estado funcional do usuario
- preferir `isPro`, `subscriptionPlan` e `adminRoles`
- reduzir dependencia do frontend em `role = PRO`

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
- destacar bilhete gratis ativo
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

- melhorar hierarquia dos pacotes
- conectar coins, duplas e super duplas
- aumentar clareza comercial da loja

### 13. Evoluir tela de perfil

Tipo:

- Frontend / UX

Status sugerido:

- `Nao iniciado`

Referencia:

- `responsive_profile_settings`

Tarefas:

- tornar status PRO mais visivel
- melhorar formulario de perfil
- deixar a gestao de conta mais clara

### 14. Criar fluxo visual de bolao

Tipo:

- Frontend / Produto

Status sugerido:

- `Nao iniciado`

Referencia:

- `responsive_create_league_modal`

Tarefas:

- criar entrada e criacao de bolao no frontend ativo
- expor regras de premium e assinatura
- organizar datas, custo e observacoes

## P1. Admin operacional

### 15. Consolidar admin de rodadas

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

### 16. Consolidar admin de usuarios

Tipo:

- Frontend / Backend

Status sugerido:

- `Nao iniciado`

Referencia:

- `admin_user_management`

Tarefas:

- expor tela ativa para gestao de usuarios
- permitir ajuste operacional de coins e beneficios
- alinhar com o modelo final de assinatura e roles

### 17. Consolidar logs operacionais no admin

Tipo:

- Frontend / Backend / Operacao

Status sugerido:

- `Nao iniciado`

Referencia:

- `admin_system_logs`

Tarefas:

- definir fonte de logs visiveis
- criar filtros uteis para operacao
- expor trilha auditavel de eventos relevantes

## P2. Qualidade, seguranca e operacao

### 18. Endurecer jobs internos, webhooks e auditoria

Tipo:

- Backend / Seguranca

Status sugerido:

- `Parcial`

Tarefas:

- revisar protecao de jobs internos
- amadurecer trilha auditavel
- revisar idempotencia e rastreabilidade de webhooks

### 19. Fechar observabilidade minima

Tipo:

- Infra / Operacao

Status sugerido:

- `Nao iniciado`

Tarefas:

- logs estruturados
- healthchecks uteis
- checklist de incidente
- visibilidade minima para pagamentos e jobs

### 20. Definir rotina de backup e restore

Tipo:

- Banco / Operacao

Status sugerido:

- `Nao iniciado`

Tarefas:

- definir backup do Postgres
- definir restore testado
- documentar operacao

## P2. Arquitetura de frontend

### 21. Criar mini design system do Fantasy12

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

### 22. Remover ou arquivar definitivamente telas legadas

Tipo:

- Frontend

Status sugerido:

- `Parcial`

Tarefas:

- revisar telas antigas fora do fluxo ativo
- remover `fetch` hardcoded restante
- evitar duplicidade de UX e contrato

## P3. Expansao controlada

### 23. Refinar experiencia premium

Tipo:

- Produto / Frontend / Backend

Status sugerido:

- `Nao iniciado`

Tarefas:

- destacar valor do PRO
- diferenciar mensal e anual
- preparar eventos exclusivos e beneficios premium

### 24. Automatizar CI/CD completo

Tipo:

- Infra / Operacao

Status sugerido:

- `Parcial`

Tarefas:

- pipeline de build
- pipeline de deploy
- padrao de release

## Ordem recomendada agora

1. P0 de DNS, CORS e bootstrap
2. regras centrais de `PRO`, beneficios e rankings
3. fluxo principal do jogador
4. bar e monetizacao
5. admin operacional
6. observabilidade e CI/CD

## Observacao final

Os documentos abaixo continuam valiosos, mas agora devem ser lidos como analise de suporte:

- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)

A fonte oficial de prioridades passa a ser este arquivo.
