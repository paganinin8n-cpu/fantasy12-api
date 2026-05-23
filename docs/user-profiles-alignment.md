# Alinhamento de Perfis de Usuario

Referencia analisada:

- `/Users/roberson/Downloads/Fantasy12_Perfis_Usuarios_Atualizado (1).pdf`

Data da analise:

- 2026-05-15

Ultima atualizacao:

- 2026-05-22

Uso recomendado deste documento:

- referencia de analise de dominio e perfis
- backlog oficial consolidado em [`docs/backlog-master.md`](/Users/roberson/dev/personal/fantasy12-api/docs/backlog-master.md)

## Resumo executivo

O PDF esta conceitualmente bem alinhado com a direcao do Fantasy12, principalmente em:

- backend como fonte da verdade
- `ADMIN` como role estrutural
- `PRO` como estado de assinatura
- beneficios gratuitos por rodada nao acumulativos
- creditos comprados persistentes
- regras criticas, rankings e financeiro governados pelo backend

O principal desalinhamento atual do codigo e este:

- o documento define `PRO` como estado de assinatura
- o codigo ainda usa `User.role = PRO` em partes importantes da regra de negocio

Em outras palavras: a arquitetura desejada esta parcialmente implementada, mas ainda existe um modelo hibrido entre `role` e `subscription`.

## Matriz de alinhamento

| Regra do PDF | Status no codigo | Evidencia |
|---|---|---|
| `ADMIN` deve ser role estrutural | `Implementado` | [`prisma/schema.prisma`](/Users/roberson/dev/personal/fantasy12-api/prisma/schema.prisma) tem RBAC admin com `AdminRole`, `AdminPermission`, `UserAdminRole` |
| `PRO` deve ser estado de assinatura | `Parcial` | existe model `Subscription`, mas servicos ainda usam `User.role = PRO` |
| Backend governa regras do sistema | `Implementado` | regras de round, beneficios, wallet, subscription, ranking e jobs estao no backend |
| Frontend apenas renderiza estados/permissoes | `Implementado` | frontend consome `/api/me`, `/api/subscription`, `/api/wallet` e usa sessao |
| FREE recebe duplas gratis por rodada | `Parcial` | existe `RoundBenefit` e job de abertura concede beneficios, mas a regra FREE x PRO precisa ser auditada ponta a ponta |
| PRO recebe mais beneficios por rodada | `Parcial` | estrutura suporta `freeDoubles` e `freeSuperDoubles`, mas o comportamento por plano precisa ser validado no fluxo real |
| Beneficios gratis nao acumulam entre rodadas | `Implementado` | beneficios gratuitos sao vinculados a `roundId` em `RoundBenefit` |
| Creditos comprados acumulam permanentemente | `Implementado` | `Wallet` e `WalletLedger` persistem saldo e historico |
| Sistema consome primeiro creditos gratis | `Implementado` | [`src/services/benefits/consume-benefits.service.ts`](/Users/roberson/dev/personal/fantasy12-api/src/services/benefits/consume-benefits.service.ts) consome `RoundBenefit` antes de inventario e wallet |
| Rankings FREE e PRO devem ser separados | `Parcial` | existe `RankingType = GLOBAL | PRO | BOLAO`, mas a separacao funcional completa ainda precisa validacao |
| Boloes devem ter inicio e encerramento | `Parcial` | criacao atual usa `durationDays`; inicio/encerramento operacional ainda deve ser acompanhado no fluxo de status |
| Bolao premium apenas para PRO ANUAL | `Implementado` | `CreateBolaoService` usa `hasAnnualProSubscription` antes de criar bolao |
| Ranking PRO mensal automatico para PRO ativos | `Parcial` | existem ranking mensal e jobs de subscription, mas nao vi garantia clara de inscricao automatica por assinatura ativa |
| Login via email | `Implementado` | rota [`src/routes/auth.ts`](/Users/roberson/dev/personal/fantasy12-api/src/routes/auth.ts) |
| Login via Google | `Nao implementado` | nao encontrei fluxo OAuth/Google no backend ou frontend atual |
| Compra e uso de coins | `Implementado` | models `PaymentPackage`, `Payment`, `Wallet`, `WalletLedger` e telas/servicos de payment/wallet |
| Controle financeiro e auditoria admin | `Implementado` | billing metrics, admin monetization, wallet credit, audit logs |
| Jobs internos protegidos e auditaveis | `Parcial` | jobs usam `INTERNAL_JOB_SECRET`, mas trilha de auditoria operacional ainda pode amadurecer |
| Toda movimentacao financeira rastreavel | `Implementado` | `Payment`, `PaymentWebhookEvent`, `WalletLedger`, servicos admin de billing |

## Principais alinhamentos

### 1. `ADMIN` como role estrutural

Isso esta coerente com o documento. O projeto nao depende apenas de `User.role` para administracao, porque existe uma camada especifica de RBAC admin:

- `AdminRole`
- `AdminPermission`
- `UserAdminRole`
- `AdminAuditLog`

Esse desenho esta alinhado com a diretriz de separar administracao do restante do dominio.

### 2. Creditos e beneficios por rodada

O documento define:

- beneficios gratis nao acumulam
- creditos comprados acumulam
- beneficios gratis devem ser consumidos primeiro

Isso esta bem refletido no backend:

- beneficios da rodada vivem em `RoundBenefit`
- saldo persistente vive em `Wallet`
- historico vive em `WalletLedger`
- consumo prioriza `RoundBenefit`, depois inventario, depois wallet

### 3. Backend soberano

O projeto atual segue essa direcao:

- abertura de rodada e concessao de beneficios ocorrem no backend
- ranking e snapshot sao responsabilidade do backend
- subscription, payment e wallet sao backend-driven
- frontend apenas consulta e renderiza

## Principais desalinhamentos

### 1. `PRO` ainda esta misturado entre assinatura e role

Esse e o gap mais importante.

O documento diz:

- `PRO` deve ser tratado como estado de assinatura

Mas hoje o codigo ainda mistura isso com `User.role`.

Exemplos:

- [`src/services/ranking/create-ranking.service.ts`](/Users/roberson/dev/personal/fantasy12-api/src/services/ranking/create-ranking.service.ts) restringe participantes PRO por `user.role = PRO`
- [`src/services/alerts/detect-subscription-anomalies.service.ts`](/Users/roberson/dev/personal/fantasy12-api/src/services/alerts/detect-subscription-anomalies.service.ts) detecta inconsistencias entre assinatura e role
- [`src/services/user-profile.service.ts`](/Users/roberson/dev/personal/fantasy12-api/src/services/user-profile.service.ts) ainda expoe `role` como atributo central do perfil

Isso indica que o proprio codigo reconhece a inconsistenci a, mas ainda nao concluiu a migracao conceitual.

### 2. Google login nao esta presente

O PDF cita:

- cadastro e login via e-mail e Google

No codigo atual, encontrei apenas:

- login por email e senha
- forgot/reset password

Nao encontrei implementacao de OAuth/Google.

### 3. Premium restrito a PRO ANUAL

O documento diz:

- usuarios PRO anual podem participar de boloes premium e eventos exclusivos

Estado 2026-05-22:

- criacao de bolao ja exige assinatura PRO anual ativa
- a regra vive no backend, em `CreateBolaoService`
- ainda vale revisar participacao, convites e eventos exclusivos para manter a mesma regra ponta a ponta

Antes desta atualizacao, este ponto estava marcado como nao implementado. Agora ele deve ser lido como implementado para criacao e parcial para o ciclo completo de participacao em eventos premium.

### 4. Perfil de usuario foi enriquecido

O payload de `/api/me` agora inclui dados funcionais importantes para o frontend:

- `nickname`
- `phone`
- `bio`
- `profileImage`
- `adminRoles`

Isso reduz a dependencia do frontend em inferencias por `role`, especialmente para navegação administrativa.

### 5. Ranking PRO mensal automatico ainda nao esta claramente fechado

Existe base para rankings e subscriptions, mas ainda nao vi uma regra inequívoca de:

- detectar todos os PRO ativos do mes
- inscreve-los automaticamente no ranking PRO mensal

Pode haver partes disso espalhadas, mas nao aparece como fluxo canonico consolidado.

## Recomendacao de backlog

### Alta prioridade

1. Desacoplar `PRO` de `User.role`

Direcao sugerida:

- `User.role` deve ficar para papel estrutural basico ou ser simplificado
- elegibilidade PRO deve vir de `Subscription.status` + `Subscription.plan` + vigencia
- rankings, beneficios e boloes devem consultar assinatura, nao `user.role`

2. Canonizar beneficios por plano

Transformar em regra explicita de backend:

- FREE: 2 doubles
- PRO mensal: 4 doubles + 1 super double
- PRO anual: regra igual ou superior, conforme produto

3. Manter premium por plano anual ponta a ponta

Direcao:

- manter criacao de bolao restrita a `SubscriptionPlan.ANNUAL` ativo
- auditar entrada por convite e participacao em eventos premium
- garantir mensagens de erro claras no frontend

### Media prioridade

4. Continuar revisando payload de perfil do usuario

O frontend ja recebe dados mais aderentes ao modelo funcional:

- `isPro`
- `subscriptionPlan`
- `adminRoles`

O proximo passo e reduzir dependencias restantes de `role = PRO` fora de administracao.

5. Implementar ou remover mencao a Google login

Se for requisito real:

- criar fluxo OAuth

Se nao for para agora:

- remover isso da documentacao funcional vigente ou marcar como roadmap

## Conclusao

O PDF e uma boa referencia funcional e pode ser considerado valido como diretriz de negocio.

Ele esta mais alinhado ao futuro desejado do sistema do que ao estado exato da implementacao atual.

Em resumo:

- regras de backend, beneficios, wallet, admin e auditoria: bem alinhadas
- modelo conceitual de `PRO` como assinatura: parcialmente alinhado
- login Google e premium anual: ainda nao alinhados

O maior trabalho de maturidade agora e concluir a transicao de um modelo baseado em `role` para um modelo baseado em `subscription`.
