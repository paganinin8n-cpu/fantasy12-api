# Backlog Mestre

Data de consolidacao:

- 2026-05-15

Ultima atualizacao:

- 2026-07-22

Objetivo:

- manter um unico backlog oficial do Fantasy12
- separar claramente produto, frontend, backend, operacao e seguranca
- usar os outros documentos como insumo de analise, nao como backlogs paralelos

Documentos de origem:

- [`docs/roadmap.md`](/Users/roberson/dev/personal/fantasy12-api/docs/roadmap.md)
- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)
- [`docs/security-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/security-review.md)
- [`docs/updates-2026-05-18-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-18-review.md)
- [`docs/updates-2026-05-22-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-22-review.md)

## Como ler este backlog

## Fechamento das regras oficiais — fase sem premiação patrocinada

Status da fase em 2026-07-15:

- [x] Palpite exige exatamente 12 jogos e aceita somente `1`, `X` ou `2`
- [x] Pontuação simples `+1/0`, Dupla `+2/-2`, Super Dupla `+4/-4` e jogo cancelado com zero
- [x] FREE recebe 2 Duplas; PRO recebe 4 Duplas e 2 Super Duplas por rodada
- [x] Consumo usa primeiro o saldo grátis da rodada e depois o inventário comprado
- [x] Saldos totais, grátis e comprados são expostos para a interface
- [x] Calendário oficial da rodada derivado dos 12 horários no fuso `America/Sao_Paulo`
- [x] Rodada pode começar em qualquer dia e abre às 00:00 do dia anterior ao primeiro jogo
- [x] Fechamento dos palpites ocorre uma hora antes do primeiro jogo
- [x] Abertura manual imediata continua como override operacional separado da agenda persistida
- [x] Rankings mensais Geral e PRO usam os limites civis do mês em São Paulo
- [x] Coorte mensal fecha junto com a primeira rodada válida do mês
- [x] Fechamento atrasado usa o último acumulado histórico até o fim da competição
- [x] Pontuação negativa é preservada
- [x] Mesa exige PRO ativo, regras/observações, entrada positiva e distribuição de 100%
- [x] Mesa válida nasce `ACTIVE`; `DRAFT` permanece apenas como compatibilidade de fechamento legado
- [x] Entrada do criador e dos participantes é imediata, atômica e condicionada ao saldo de fichas
- [x] Mesa aceita inscrições somente antes do fechamento da primeira rodada
- [x] Caixa, taxa, prêmio líquido e pagamentos aos vencedores são auditáveis
- [x] Política de taxa: `floor(10%)`; como fichas são indivisíveis, todo resto fica no prêmio dos jogadores
- [x] Liquidação de Mesa possui preflight e bloqueia configuração financeira legada inconsistente
- [x] Diagnóstico somente leitura disponível em `npm run mesa:integrity:diagnose`
- [x] Fluxo administrativo legado que ignorava as regras financeiras foi desativado
- [x] Jobs BullMQ cobrem abertura/fechamento de rodadas, fechamento de competições e coortes mensais

Exceção técnica documentada:

- `RankingParticipant.score` é congelado no encerramento para preservar resultado histórico imutável; durante a competição, a fonte canônica continua sendo `User.scoreTotal - scoreInitial`

### Premiação adiada — fora da fase atual

Os itens abaixo ficam deliberadamente parados. Eles não bloqueiam o fechamento das demais regras:

- [ ] Configuração de campanhas de premiação mensal PRO
- [ ] Publicação antecipada do prêmio antes do início da competição
- [ ] Origem contábil do prêmio da plataforma ou patrocinador
- [ ] Prêmio patrocinado de Mesa
- [ ] Regra para prêmio do patrocinador substituir ou complementar fichas
- [ ] Catálogo oficial de produtos
- [ ] Estoque e preço em fichas dos produtos
- [ ] Solicitação, aprovação, separação, entrega e cancelamento de resgate
- [ ] Reembolso de fichas em resgate cancelado
- [ ] Histórico de resgates do usuário e operação administrativa
- [ ] Textos legais e de interface: ficha não é dinheiro, não é sacável e não é transferível
- [ ] Explicação da referência de catálogo `1 ficha = R$ 0,50`

Partes financeiras de Mesa já entregues, mesmo com a premiação patrocinada adiada:

- [x] Formação do prêmio com entradas dos participantes
- [x] Retenção da taxa da plataforma
- [x] Distribuição percentual entre posições, inclusive empates e maiores restos
- [x] Crédito automático e idempotente das fichas aos vencedores
- [x] Regras/observações da premiação obrigatórias
- [x] Exibição de arrecadação, taxa e prêmio líquido

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

## P0/P1. Programa de seguranca — revisao 2026-07-22

Objetivo:

- proteger integridade financeira, contas, operacoes administrativas e pagamentos
- transformar achados da revisao de seguranca em trabalho sequenciado e verificavel
- impedir release quando um controle critico regredir

Regra de execucao:

- itens `Release blocker` precisam estar concluidos antes do proximo deploy de producao
- cada item deve incluir teste de regressao no mesmo PR
- correcoes de saldo, inventario, pagamento e sessao exigem revisao de seguranca
- este trecho e a fila oficial; `docs/security-review.md` permanece como evidencia e contexto

### Ordem de entrega

1. Contencao imediata: `SEC-003` e `SEC-004`
2. Integridade financeira e de requisicao: `SEC-001` e `SEC-002`
3. Identidade e autorizacao: `SEC-005`, `SEC-007` e `SEC-009`
4. Fronteiras de entrada e concorrencia: `SEC-006` e `SEC-008`
5. Plataforma, privacidade e gates: `SEC-010`, `SEC-011` e `SEC-012`

### SEC-001 — Tornar debitos e consumos atomicamente seguros

Prioridade:

- `P0`
- `Release blocker`

Tipo:

- Backend / Banco / Integridade financeira

Status:

- `Implementado localmente; pendente aplicar migration e validar concorrencia no PostgreSQL de homologacao`

Nota 2026-07-22:

- debitos de carteira e inventario agora usam updates condicionais
- constraints nao negativas foram adicionadas para migration e bootstrap fresh
- testes unitarios cobrem disputa perdida e impedem ledger sem debito

Problema:

- debitos de carteira fazem leitura, validacao e decremento em operacoes separadas
- requisicoes concorrentes podem aprovar o mesmo saldo e deixar a carteira negativa
- estoques de beneficios usam padrao semelhante e nao possuem restricao final no banco

Escopo:

- trocar debitos por `UPDATE ... WHERE balance >= amount` e exigir uma linha alterada
- aplicar o mesmo padrao a inventarios e beneficios consumiveis
- adicionar constraints para impedir saldo, quantidade e beneficios negativos
- revisar debito administrativo com a mesma regra

Criterios de aceite:

- duas compras concorrentes nunca gastam o mesmo saldo
- saldo e inventario nunca ficam negativos, inclusive por SQL direto acidental
- ledger e saldo permanecem atomicamente consistentes
- testes concorrentes executam contra PostgreSQL real e cobrem sucesso mais rejeicao

Dependencias:

- nenhuma

### SEC-002 — Proteger mutacoes autenticadas contra CSRF

Prioridade:

- `P0`
- `Release blocker`

Tipo:

- Backend / Frontend / Autenticacao

Status:

- `Implementado localmente; pendente QA integrado com o frontend oficial`

Nota 2026-07-22:

- mutacoes com sessao exigem `Origin` ou `Referer` oficial
- corpos autenticados precisam usar `application/json`
- rotas internas e mutacoes publicas preservam seus controles proprios
- suite cobre origem valida, ausente, invalida e content type inseguro

Problema:

- autenticacao usa cookie de sessao
- producao pode operar com `SameSite=None`
- rotas mutaveis nao validam token CSRF nem origem da requisicao

Escopo:

- escolher e documentar token CSRF ou validacao estrita de `Origin`/`Referer`
- aplicar o controle a todo `POST`, `PUT`, `PATCH` e `DELETE` autenticado
- exigir `application/json` nas mutacoes da API
- manter excecoes explicitas somente para webhooks e jobs com autenticacao propria
- usar `SameSite=Lax` ou `Strict` quando a topologia permitir

Criterios de aceite:

- requisicao cross-site sem prova CSRF recebe `403`
- frontend oficial continua operando com credenciais
- webhooks e jobs continuam funcionais e nao passam pelo controle de sessao
- testes cobrem usuario normal, administrador, origem ausente, origem invalida e preflight

Dependencias:

- alinhamento com o frontend e dominios oficiais

### SEC-003 — Eliminar vulnerabilidades conhecidas de dependencias

Prioridade:

- `P0`
- `Release blocker`

Tipo:

- Backend / Supply chain

Status:

- `Concluido`

Nota 2026-07-22:

- dependencias diretas e transitivas vulneraveis foram atualizadas
- `npm audit --omit=dev` passou de 8 vulnerabilidades para zero
- audit de producao agora faz parte de `npm run ci:check`

Baseline 2026-07-22:

- `npm audit --omit=dev`: 8 vulnerabilidades
- 3 altas e 5 moderadas
- pacotes diretos afetados incluem `axios`, `nodemailer`, `express` e `express-rate-limit`

Escopo:

- atualizar `axios` para versao sem os advisories reportados
- atualizar `nodemailer` e validar compatibilidade SMTP
- atualizar Express, rate limiter e dependencias transitivas vulneraveis
- revisar o lockfile completo depois das atualizacoes

Criterios de aceite:

- `npm audit --omit=dev` nao reporta vulnerabilidade alta ou critica
- vulnerabilidade moderada remanescente possui excecao documentada, dono e prazo
- checkout, consulta de pagamento, email e rate limiting possuem testes verdes
- lockfile atualizado e reproduzivel com `npm ci`

Dependencias:

- nenhuma

### SEC-004 — Endurecer autenticidade e logs do webhook Mercado Pago

Prioridade:

- `P0`
- `Release blocker`

Tipo:

- Backend / Pagamentos / Observabilidade

Status:

- `Concluido localmente; pendente deploy e observacao operacional`

Nota 2026-07-22:

- HMAC, assinatura recebida e manifest foram removidos dos logs de falha
- assinatura moderna ganhou janela de validade e limites de entrada
- IPN legacy ganhou rate limit separado e mais restritivo
- testes cobrem replay, vazamento em log e entrada acima dos limites

Problema:

- falhas de assinatura registram HMAC esperado e recebido
- timestamp assinado nao possui janela de validade
- IPN legacy numerica ignora HMAC e pode amplificar chamadas ao provedor

Escopo:

- remover assinaturas, HMAC e manifest completo dos logs
- validar formato e janela de tempo do timestamp
- limitar tamanho de headers, IDs e payloads do webhook
- isolar IPN legacy com limite mais restritivo e politica de desativacao
- preservar consulta ao provedor, validacao de valor/moeda/referencia e idempotencia

Criterios de aceite:

- nenhum log contem segredo ou material de assinatura reutilizavel
- evento moderno expirado e rejeitado
- evento moderno valido continua aceito com as duas chaves configuradas
- IPN legacy nao consegue criar credito sem confirmacao autentica no Mercado Pago
- testes cobrem replay, timestamp futuro, assinatura malformada e rotacao de chave

Dependencias:

- `SEC-003` recomendado antes da validacao final do cliente Axios

### SEC-005 — Consolidar ciclo de vida de sessao

Prioridade:

- `P1`

Tipo:

- Backend / Autenticacao / Infraestrutura

Status:

- `Concluido, implantado e QA de producao aprovado em 2026-07-24`

Nota de conclusao 2026-07-24:

- deploy oficial do SEC-005 aprovado no run [30053877020](https://github.com/paganinin8n-cpu/fantasy12-api/actions/runs/30053877020), com a migration `20260723150000_add_user_session_version` aplicada e os quatro invariantes financeiros preservados em zero
- Redis privado e autenticado opera com AOF, `appendfsync=everysec` e `maxmemory-policy=noeviction`; a API usa timeout ocioso de 30 minutos e expiracao absoluta de 24 horas
- QA de producao aprovado no run [30059297261](https://github.com/paganinin8n-cpu/fantasy12-api/actions/runs/30059297261): duas sessoes independentes, persistencia apos reinicio de Redis e API, leitura compartilhada em duas replicas, revogacao por troca de senha e exclusao correta do cookie no logout
- o QA removeu a conta sintetica e suas sessoes, restaurou API e Redis para `1/1` e a saude final permaneceu `api=ok`, `db=ok`, versao `a27ae52d7f71edf4796f78810c7d69b121fd0e699d6c9a3b3861cb7dd0d3b098`
- workflow reutilizavel de QA ficou versionado em `.github/workflows/session-security-qa.yml`; o deploy final de verificacao foi aprovado no run [30059170481](https://github.com/paganinin8n-cpu/fantasy12-api/actions/runs/30059170481)

Nota 2026-07-23:

- sessoes migradas do `MemoryStore` para Redis compartilhado
- login regenera o ID antes de persistir a identidade autenticada
- timeout ocioso e expiracao absoluta ficaram configuraveis
- reset/troca de senha e bloqueio administrativo incrementam `sessionVersion` e removem sessoes Redis
- cookies de logout/revogacao reutilizam os atributos de criacao
- JWT sem consumidor foi removido do login e das dependencias
- suite de seguranca cobre rotacao, expiracao, revogacao e paridade do cookie

Escopo:

- substituir `MemoryStore` por store compartilhado de producao
- regenerar ID da sessao depois do login
- definir timeout ocioso e expiracao absoluta
- revogar outras sessoes apos reset/troca de senha e bloqueio administrativo
- remover geracao JWT nao utilizada ou formalizar seu caso de uso

Criterios de aceite:

- sessoes sobrevivem reinicio controlado e funcionam com mais de uma replica
- login troca o identificador anonimo por um novo identificador autenticado
- reset de senha invalida sessoes anteriores
- cookies sao apagados com os mesmos atributos usados na criacao
- testes cobrem expiracao, rotacao, logout e revogacao

Dependencias:

- Redis ou store compartilhado definido pela infraestrutura
- `SEC-002` deve usar o mesmo modelo oficial de sessao

### SEC-006 — Padronizar validacao de entrada em todas as rotas

Prioridade:

- `P1`

Tipo:

- Backend / API

Status:

- `Nao iniciado`

Escopo inicial:

- monetizacao administrativa
- criacao, atualizacao e resultado de rodada
- CRUD administrativo de times
- criacao, revisao, fechamento e convites de Mesa
- filtros, paginacao, UUIDs, datas, enums e inteiros financeiros

Criterios de aceite:

- toda entrada de body, params e query possui schema explicito
- schemas rejeitam campos desconhecidos em operacoes sensiveis
- valores financeiros aceitam apenas inteiros positivos dentro de limite documentado
- paginacao possui limites maximos
- nenhum controller sensivel depende de `Number(req.body...)` ou cast sem validacao
- testes negativos cobrem tipo incorreto, overflow, enum invalido e payload extra

Dependencias:

- nenhuma; pode ser dividido por dominio

### SEC-007 — Unificar autorizacao no RBAC granular

Prioridade:

- `P1`

Tipo:

- Backend / Autorizacao / Admin

Status:

- `Nao iniciado`

Escopo:

- remover bypass de operacoes sensiveis baseado apenas em `User.role = ADMIN`
- exigir permissao especifica para fechamento e liquidacao forcada de Mesa
- revisar todas as rotas admin e servicos chamados fora de roteadores admin
- definir politica de separacao entre permissao financeira e de competicao
- registrar resultado da operacao, nao somente permissao concedida

Criterios de aceite:

- administrador sem permissao especifica recebe `403`
- `SUPERADMIN` continua com bypass explicitamente testado
- operacao financeira ou de liquidacao gera auditoria de sucesso e falha
- matriz rota x permissao fica versionada e coberta por testes

Dependencias:

- catalogo oficial de permissoes administrativas

### SEC-008 — Corrigir concorrencia e semantica de convites de Mesa

Prioridade:

- `P1`

Tipo:

- Backend / Dominio / Integridade

Status:

- `Nao iniciado`

Escopo:

- executar reserva do convite, entrada e incremento em uma unica transacao
- usar incremento condicional para respeitar `maxUses`
- validar `maxUses`, `expiresAt` e codigo com schemas
- documentar se convite e requisito de acesso ou apenas atalho para Mesa publica

Criterios de aceite:

- concorrencia nunca ultrapassa `maxUses`
- falha na entrada nao consome uso do convite
- uso repetido pelo mesmo usuario e idempotente ou explicitamente rejeitado
- testes concorrentes executam contra PostgreSQL real

Dependencias:

- decisao de produto sobre Mesa publica versus privada
- reutilizar padrao atomico de `SEC-001`

### SEC-009 — Endurecer identidade, senhas e lockout

Prioridade:

- `P1`

Tipo:

- Backend / Identidade

Status:

- `Nao iniciado`

Escopo:

- normalizar email antes de consultar e persistir
- garantir unicidade case-insensitive no banco
- validar e normalizar CPF e telefone
- elevar politica de senha e permitir senhas longas
- tornar incremento de falhas e lockout atomicos
- avaliar protecao por conta mais IP/dispositivo sem facilitar DoS de lockout

Criterios de aceite:

- variantes de caixa do mesmo email nao criam contas diferentes
- cadastro, login e reset usam a mesma identidade canonica
- tentativas paralelas nao burlam o lockout
- politica de senha fica centralizada e compartilhada pelos tres fluxos
- testes cobrem Unicode, caixa, concorrencia e senha longa

Dependencias:

- plano de migracao para emails existentes antes da constraint

### SEC-010 — Minimizar e governar PII e dados de pagamento

Prioridade:

- `P1`

Tipo:

- Backend / Privacidade / Operacao

Status:

- `Nao iniciado`

Escopo:

- remover email de logs de recuperacao e entrega ou aplicar mascaramento
- inventariar CPF, telefone, email e payload completo do Mercado Pago
- definir retencao e expurgo para tokens, webhooks, auditoria e logs
- limitar acesso operacional a dados sensiveis
- documentar criptografia em transito, repouso e backups

Criterios de aceite:

- logs normais nao contem CPF, token, cookie, assinatura ou email completo
- payload de pagamento persiste somente campos necessarios ou possui retencao definida
- processo de expurgo e testavel e auditavel
- matriz de dados documenta finalidade, retencao e acesso

Dependencias:

- politica legal/LGPD e requisitos operacionais de auditoria

### SEC-011 — Criar suite e gates de seguranca

Prioridade:

- `P1`

Tipo:

- QA / CI / Seguranca

Status:

- `Nao iniciado`

Escopo:

- adicionar testes de autenticacao, autorizacao, CSRF, rate limit e headers
- adicionar testes concorrentes para carteira, inventario e convite
- tornar audit de dependencias um gate de release
- transformar os 39 achados conhecidos da cadeia legacy de migrations em baseline controlada
- falhar CI quando surgir regressao nova na cadeia, baseline fresh ou politica de bootstrap

Criterios de aceite:

- PR nao pode reduzir controles de rota sem teste falhar
- vulnerabilidade alta ou critica bloqueia release
- regressao nova de migration bloqueia CI sem exigir que a cadeia legacy seja reescrita
- suite publica relatorio reproduzivel e mantem tempo de execucao aceitavel

Dependencias:

- cenarios produzidos por `SEC-001` a `SEC-009`

### SEC-012 — Endurecer container e runtime de producao

Prioridade:

- `P1`

Tipo:

- Infraestrutura / Supply chain

Status:

- `Nao iniciado`

Escopo:

- migrar para runtime Node LTS suportado
- executar processo como usuario nao-root
- instalar/copiar apenas dependencias de producao no runtime
- fixar imagem por digest e automatizar atualizacoes
- revisar pacotes de sistema e superficie dos scripts copiados
- gerar SBOM e registrar procedencia da imagem

Criterios de aceite:

- container nao executa a aplicacao como root
- runtime nao contem dependencias de desenvolvimento
- scanner de imagem nao reporta vulnerabilidade alta/critica sem excecao aprovada
- healthcheck, API, worker, Prisma e scripts operacionais continuam funcionais

Dependencias:

- `SEC-003` para baseline limpa de dependencias Node

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

Nota 2026-06-20:

- limpeza estrutural executada: `UserRole.PRO` removido do Prisma schema, baseline fresh e contratos de frontend
- migracao `20260620_remove_userrole_pro` converte usuarios legados com `role = PRO` para `NORMAL`
- assinatura ativa continua sendo a fonte unica de elegibilidade PRO
- `npm run product:rules:check`, baseline fresh e build da API validam a regra

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

- `Concluido`

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

Nota 2026-06-20:

- tela `Admin > Usuarios` consolidada com busca server-side, paginacao, ordenacao por cadastro recente e grade operacional
- plano exibido passa a depender de assinatura ativa, sem fallback por `User.role = PRO`
- detalhe progressivo por abas (`Resumo`, `Acesso`, `Plano`, `Saldos`, `Historico`) substitui a exibicao simultanea de muitos cards
- aba `Resumo` passou a mostrar estado operacional da conta, plano, fichas, duplas e super duplas
- ajustes rapidos de fichas, duplas e super duplas continuam exigindo motivo e gerando auditoria

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

- `Concluido`

Tarefas:

- pipeline de build
- pipeline de deploy
- padrao de release

Nota 2026-07-04:

- workflow .github/workflows/deploy.yml consolidado como CI/CD oficial da API
- pull requests para main passam por npm ci, Prisma Client, npm run ci:check e build Docker
- push para main empacota o codigo-fonte, sincroniza o diretorio do serviço api no EasyPanel, aciona deploy via RPC e valida /health
- baseline fresh Prisma foi realinhada ao schema atual para que o check de release seja confiavel
- deploy continua sem aplicar migrations automaticamente; migrations seguem como etapa explicita de release controlada

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

Nota 2026-07-05:

- historico de palpites nao deve sumir quando houver rodada aberta ou palpite atual
- tela Meus palpites deve priorizar o palpite atual em aberto, mas manter o historico visivel logo abaixo
- dashboard e menu do usuario devem manter atalho claro para Meus palpites
- copy do fluxo de envio deve falar em conferir/confirmar palpites, nao em finalizar analise
- Dupla e Super so podem ser marcadas depois que o usuario escolher Casa, Empate ou Fora no jogo
- envio definitivo continua exigindo palpite marcado nos 12 jogos da rodada

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

Nota 2026-06-20:

- passada responsiva consolidada nas telas principais do jogador e admin sem alterar regra de negocio
- Dashboard virou tela de decisao rapida e moveu Ranking para rota propria `/ranking`
- menu inferior mobile preserva `Home`, `Palpites`, `Ranking`, `Bar` e `Perfil`
- Bar, Mesas, Meus palpites, Palpites e Admin Usuarios mantem dados/cálculos existentes com melhor separacao visual
- termos tecnicos visiveis foram reduzidos nas superficies principais; estados seguem traduzidos para portugues quando exibidos ao usuario

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

- `Implementado localmente em 2026-06-14`

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

### 36. Evoluir Dashboard mobile com selo de plano e slot de campanha

Tipo:

- Frontend / UX Jogador / Monetizacao

Status sugerido:

- `Implementado localmente em 2026-06-14`

Objetivo:

- aproximar o Dashboard de uma experiencia mobile app-like sem mudar regras de negocio

Tarefas:

- exibir o plano do usuario ao lado da saudacao
- remover o plano dos resumos numericos quando nao for informacao operacional
- deixar um slot de campanha/patrocinio que aparece somente quando houver campanha ativa
- manter CTA principal de palpite como primeira acao da tela
- preservar ranking, Bar, Mesas e historico como areas secundarias

Critérios de aceite:

- usuario identifica rapidamente se esta Free, PRO, PRO anual ou Admin
- campanha inativa nao ocupa espaco na tela
- campanha ativa nao compete com o CTA de palpite
- layout mobile continua sem sobreposicao ou rolagem horizontal

### 37. Redefinir logica de Mesas com entrada imediata e ranking por periodo

Tipo:

- Backend / Frontend / Produto / Ranking

Status sugerido:

- `Backlog detalhado em 2026-06-25`

Objetivo:

- transformar Mesas em disputas com criação PRO, entrada imediata mediante pagamento em fichas, período definido e ranking calculado somente sobre a pontuação feita durante a janela em que cada participante esteve na Mesa.

Regras de produto:

- somente usuario PRO pode criar Mesa
- usuario normal nao pode criar Mesa
- criador PRO define o minimo de fichas exigido para participacao
- qualquer usuário autenticado pode entrar em Mesa aberta se possuir as fichas exigidas
- Mesas tem periodo de inicio e fim
- cards de Mesas abertas devem mostrar claramente:
  - nome da Mesa
  - criador
  - minimo de fichas
  - quantidade de participantes/limite, se houver
  - periodo de inicio e fim
  - status de entrada do usuario: pode entrar, participando, encerrada ou saldo insuficiente
- entrada em Mesa é automática quando o participante possui as fichas exigidas, sem aprovação do criador
- o débito, o snapshot inicial e a inclusão no ranking acontecem na mesma transação

Regras de ranking historico:

- o ranking global/acumulado do usuario continua historico e cumulativo enquanto ele estiver no sistema
- o ranking da Mesa nao substitui nem reseta o ranking global
- ao confirmar a entrada de um usuario em uma Mesa, gravar snapshot da pontuacao global imediatamente anterior/atual ao momento de entrada oficial
- ao finalizar a Mesa, gravar snapshot da pontuacao global do participante no momento de fechamento da Mesa
- pontuacao do participante na Mesa deve ser calculada como:
  - `pontuacaoFinalNaMesa = rankingGlobalNoFechamento - rankingGlobalNaEntrada`
- guardar log/snapshot para auditoria da Mesa, nao depender apenas de recalculo ad hoc em tela
- se o usuario entrar depois do inicio da Mesa, a pontuacao inicial dele deve ser a pontuacao global no momento da entrada, nao a pontuacao do inicio da Mesa
- se a Mesa fechar em uma data futura, a pontuacao final precisa refletir o ranking global consolidado ate o fechamento, respeitando a mesma fonte de verdade do ranking global
- se houver reprocessamento de rodada/ranking que altere pontuacao historica dentro do periodo da Mesa, definir politica antes de implementar:
  - opcao preferida: recalcular snapshots derivados com job auditavel e registrar evento de reprocessamento
  - opcao conservadora: manter snapshots fechados imutaveis depois do fechamento e registrar ajuste manual se necessario

Modelo de dados a avaliar:

- `Table`/`Mesa`
  - `id`
  - `creatorId`
  - `name`
  - `description`
  - `minChips`
  - `startAt`
  - `endAt`
  - `status`: `OPEN`, `IN_PROGRESS`, `FINISHED`, `CANCELLED`
- `TableParticipant`
  - `id`
  - `tableId`
  - `userId`
  - `joinedAt`
  - `entryGlobalScore`
  - `finalGlobalScore`
  - `tableScore`
  - `closedAt`
  - `status`: `ACTIVE`, `FINISHED`, `REMOVED`
- `TableScoreAuditLog`
  - `id`
  - `tableId`
  - `userId`
  - `action`: `JOIN_CONFIRMED`, `SCORE_SNAPSHOT_ENTRY`, `SCORE_SNAPSHOT_FINAL`, `TABLE_CLOSED`, `SCORE_REPROCESSED`
  - `metadata`
  - `createdAt`

Backend - tarefas:

- validar elegibilidade PRO para criar Mesa
- validar saldo e debitar as fichas atomicamente ao entrar
- bloquear entrada duplicada para mesma Mesa
- criar participante aprovado e gravar snapshot de pontuacao global na mesma transacao
- criar fluxo de fechamento de Mesa que:
  - localiza participantes aprovados
  - captura pontuacao global final de cada um
  - calcula `tableScore`
  - persiste snapshots e logs
  - muda status da Mesa para `FINISHED`
- definir se fechamento e manual pelo criador/admin, automatico por `endAt`, ou ambos
- expor endpoints para:
  - listar Mesas abertas
  - criar Mesa
  - entrar imediatamente mediante pagamento em fichas
  - ver detalhe/ranking da Mesa
  - fechar Mesa

Frontend - tarefas:

- card de Mesa aberta deve mostrar periodo de inicio/fim
- qualquer usuario autenticado ve o botao `Entrar agora` quando a janela estiver aberta
- usuario com entrada confirmada ve estado `Participando`
- detalhe da Mesa deve separar:
  - resumo/regras
  - participantes
  - ranking da Mesa
  - historico/auditoria basica

Perguntas antes de implementar:

- fichas de entrada são debitadas imediatamente ao entrar
- usuario criador entra automaticamente como participante da Mesa?
- Mesa pode ter limite maximo de participantes?
- Mesa pode comecar antes de `startAt` se o criador quiser?
- fechamento deve ser automatico por `endAt`, manual, ou ambos?
- o ranking da Mesa considera todas as pontuacoes do usuario no periodo ou apenas rodadas fechadas/apuradas dentro do periodo?
- em reprocessamento de ranking global, Mesas finalizadas devem recalcular ou manter snapshots imutaveis?

Criterios de aceite:

- usuario normal consegue entrar em Mesa aberta quando possui as fichas exigidas
- usuario PRO consegue criar Mesa com minimo de fichas e periodo
- qualquer usuario autenticado com saldo suficiente entra sem aprovação do criador
- participante tem snapshot de pontuacao global gravado no momento da entrada
- ao fechar Mesa, cada participante tem snapshot final e `tableScore` persistidos
- ranking da Mesa ordena por pontuacao feita dentro da Mesa, nao por pontuacao global total
- ranking global continua acumulado e historico, sem reset por Mesa
- cards de Mesas abertas exibem inicio e fim do periodo
- logs/auditoria permitem explicar de onde veio a pontuacao inicial e final de cada participante

## Ordem recomendada agora

1. consolidar Mesas com entrada imediata por fichas e ranking por periodo
2. reorganizar `Admin > Rodadas` por tarefa, sem mudar regras
3. reorganizar `Admin > Usuarios` com detalhe progressivo, mantendo a grade operacional
4. revisar Dashboard do jogador como tela de decisao rapida
5. polir fluxo de palpites e historico sem alterar motor de pontuacao
6. revisar Bar/Balcao, Mesas e Perfil com foco mobile-first
7. validar pagamento real de assinatura em producao e webhook de confirmacao
8. manter rotina de observabilidade, backup e deploy como base operacional

## Observacao final

Os documentos abaixo continuam valiosos, mas agora devem ser lidos como analise de suporte:

- [`docs/user-profiles-alignment.md`](/Users/roberson/dev/personal/fantasy12-api/docs/user-profiles-alignment.md)
- [`docs/ui-patterns-backlog.md`](/Users/roberson/dev/personal/fantasy12-api/docs/ui-patterns-backlog.md)
- [`docs/updates-2026-05-21-review.md`](/Users/roberson/dev/personal/fantasy12-api/docs/updates-2026-05-21-review.md)

A fonte oficial de prioridades passa a ser este arquivo.
### 38. Redesenhar navegacao mobile-first, dashboard de entrada e vitrine de premios

Status: Backlog
Prioridade: Alta
Frente: Frontend mobile-first / conversao / usabilidade

Objetivo:
Simplificar o acesso mobile dos usuarios e deixar mais visiveis as areas que vendem a proposta do Fantasy12: Bar, Mesas, Ranking e Premios. A tela inicial deve ser mais leve, direta e orientada para a proxima acao do usuario.

Escopo funcional:

1. Navegacao inferior mobile
- Substituir as opcoes atuais por apenas:
  - Inicio
  - Bar
  - Mesas
  - Ranking
  - Premios
- Remover Palpites da barra inferior.
- Manter o fluxo de Palpites acessivel pelo CTA principal do Inicio quando houver rodada aberta.
- A navegacao deve ser pensada primeiro para mobile, com toque confortavel, estados claros e sem excesso de texto.

2. Visual da barra inferior
- Usar a mesma cor escura da barra superior/header.
- Item selecionado deve ficar laranja, seguindo a cor principal da aplicacao.
- Itens nao selecionados devem ter contraste suficiente sobre fundo escuro.
- Evitar que a barra inferior pareca um componente separado do app; ela deve parecer parte da casca principal.

3. Nova area Premios
- Criar rota/pagina "Premios".
- Primeira versao pode ser uma landing page simples.
- Objetivo da pagina:
  - listar premios possiveis;
  - explicar que os premios serao entregues conforme regras das rodadas/mesas/campanhas;
  - aumentar curiosidade e desejo de participar.
- Conteudo inicial sugerido:
  - titulo direto: "Premios Fantasy12";
  - lista/cards simples de premios previstos;
  - aviso de que disponibilidade, periodo e criterios podem variar por campanha.
- A pagina precisa funcionar bem no mobile antes de qualquer refinamento desktop.

4. Card principal do Inicio/dashboard
- Reduzir o tamanho vertical do card superior mostrado ao usuario.
- Manter:
  - saudacao: "Ola, {nome}";
  - informacao do plano atual;
  - uma frase divertida/leve no espaco central.
- Remover do card principal:
  - pontos;
  - rodada;
  - metricas secundarias que ocupam espaco sem orientar a proxima acao.
- Manter fichas somente se for essencial para conversao/decisao; se mantiver, deve ficar discreto.

5. Regra do CTA principal laranja no Inicio
- Se existir rodada aberta e o usuario ainda nao fez palpite:
  - botao deve levar para montar o palpite;
  - texto sugerido: "Montar meu palpite".
- Se existir rodada aberta e o usuario ja fez palpite:
  - botao deve mudar para visualizar/acompanhamento;
  - texto sugerido: "Ver meu palpite" ou "Acompanhar palpite".
- Apos o usuario enviar um palpite e voltar para o Inicio:
  - exibir uma confirmacao clara de sucesso;
  - pode ser no proprio botao, em destaque proximo ao botao ou em uma mensagem curta no card;
  - texto precisa ser simples e atrativo, por exemplo:
    - "Palpite confirmado. Acompanhe por aqui."
    - "Palpite enviado. Agora e torcer."
    - "Tudo certo com seu palpite. Veja o acompanhamento."
- Se nao houver rodada aberta:
  - manter mensagem curta de indisponibilidade;
  - botao pode direcionar para Bar ou Ranking, mas nao deve prometer acao de palpite indisponivel.

6. Regras de usabilidade mobile
- Primeiro viewport deve mostrar:
  - header compacto;
  - card principal reduzido;
  - CTA principal visivel sem exigir muita rolagem.
- Evitar componentes muito altos, cards aninhados e informacoes repetidas.
- Botoes principais devem ter area de toque confortavel.
- Textos precisam caber em telas pequenas sem quebra visual estranha.
- Validar em tela mobile real ou em Playwright/mobile viewport.

Criterios de aceite:
- Barra inferior contem somente Inicio, Bar, Mesas, Ranking e Premios.
- Barra inferior usa fundo escuro e estado ativo laranja.
- Rota/pagina Premios existe e e acessivel pela barra inferior.
- Card superior do Inicio fica visivelmente menor no mobile.
- Card superior nao mostra mais pontos e rodada como metricas principais.
- CTA principal muda corretamente entre montar palpite, visualizar/acompanhamento e estado sem rodada aberta.
- Apos envio de palpite, usuario recebe feedback claro ao retornar para Inicio.
- Fluxo continua funcional para usuario normal, PRO mensal e PRO anual.
- Build frontend passa sem erros.
- Validacao visual mobile feita antes de deploy.

Notas de implementacao:
- Priorizar alteracoes no frontend.
- Evitar criar novas regras de backend se o estado de palpite/rodada ja estiver disponivel nos contratos atuais.
- Se o frontend nao tiver informacao suficiente para saber se o usuario ja fez palpite na rodada aberta, mapear contrato necessario antes da implementacao.
- Premios pode comecar estatico, mas deve ser estruturado para futura integracao com backend/campanhas.
