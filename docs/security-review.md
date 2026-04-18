# Avaliação Inicial de Segurança

## Resumo executivo

O backend já tem alguns elementos positivos, como sessão via cookie, middleware de autenticação, autorização administrativa e separação de rotas internas. Mesmo assim, o estado atual ainda não é maduro o bastante para ser tratado como seguro por padrão.

## Pontos positivos encontrados

- autenticação por sessão já implementada
- existência de `authMiddleware`
- camada de autorização para rotas administrativas
- auditoria administrativa no domínio
- segregação de rotas internas e webhooks
- histórico de pagamentos e eventos de webhook no modelo de dados

## Riscos e lacunas prioritárias

### 1. Segredo de sessão com fallback inseguro

Em `src/index.ts`, a sessão usa fallback para `'supersecret'` quando `SESSION_SECRET` não está definido.

Risco:

- qualquer ambiente mal configurado pode subir com segredo fraco e previsível

Ação recomendada:

- falhar o boot se `SESSION_SECRET` não estiver definido

### 2. CORS hardcoded

O CORS está fixado diretamente no código para uma origem específica.

Riscos:

- fragilidade ao mudar de ambiente
- chance de configuração incorreta em staging e produção
- dificuldade de operação e auditoria

Ação recomendada:

- mover origens permitidas para configuração por ambiente

### 3. Cookies e sessão sem política explícita por ambiente

Hoje o cookie está configurado com `secure: true` e `sameSite: 'none'`.

Observação:

- isso pode ser correto em produção com HTTPS
- mas precisa de política clara entre `local`, `staging` e `production`

Ação recomendada:

- parametrizar política de cookie por ambiente

### 4. Uso híbrido de sessão e JWT

O backend ainda mantém utilitários de JWT e o login gera token, mas o fluxo ativo observado está baseado em sessão.

Riscos:

- duplicidade de modelo mental
- chance de endpoints futuros assumirem mecanismos diferentes
- aumento de superfície de erro

Ação recomendada:

- eleger um modelo oficial agora
- para o estágio atual, consolidar sessão e remover dependências conceituais de JWT onde não forem necessárias

### 5. Proteção incompleta de algumas rotas

Há indício de rotas cujo controller espera usuário autenticado, mas a rota não mostrou `authMiddleware` explícito no arquivo lido.

Risco:

- falha de autorização
- comportamento inconsistente entre rotas

Ação recomendada:

- revisar todas as rotas e classificar como pública, autenticada, admin ou interna

### 6. Rotas internas protegidas apenas por segredo compartilhado

Jobs internos usam token simples via header.

Riscos:

- segredo vazado compromete execução operacional
- falta de trilha mais forte de origem e escopo

Ação recomendada:

- manter segredo por enquanto, mas rotacionável
- restringir origem por rede/proxy quando possível
- registrar auditoria de chamadas internas

### 7. Webhooks precisam de validação forte

Existe rota dedicada para Mercado Pago, o que é bom, mas a maturidade depende de garantir:

- validação de assinatura
- idempotência
- registro detalhado do evento
- tratamento resiliente de reprocessamento

### 8. Ausência visível de rate limiting

Rotas como login, pagamentos e webhooks merecem proteção adicional.

Ação recomendada:

- aplicar rate limiting por categoria de rota

## Segurança do banco e dados

O banco já está modelado, mas maturidade exige:

- credenciais separadas por ambiente
- usuário de aplicação com privilégio mínimo
- backup agendado
- teste periódico de restore
- controle de acesso ao banco
- política para dados sensíveis como CPF, telefone e pagamentos

## Segurança operacional

Itens necessários para próximo estágio:

- inventário de segredos
- política de rotação
- ambientes isolados
- logs estruturados
- trilha de auditoria para operações críticas
- runbook de incidente

## Plano de ação recomendado

### Imediato

- remover fallback inseguro de `SESSION_SECRET`
- revisar autenticação e autorização de todas as rotas
- padronizar CORS por ambiente
- decidir oficialmente entre sessão e JWT

Status atual:

- `SESSION_SECRET` agora deve existir para a API subir
- CORS passou a aceitar origens configuradas por ambiente
- política de cookie passou a ser controlável por `COOKIE_SECURE` e `COOKIE_SAME_SITE`
- `helmet` foi habilitado no entrypoint da API

### Curto prazo

- aplicar rate limiting
- endurecer webhook e jobs internos
- revisar exposição de dados sensíveis em logs
- documentar segredos obrigatórios

### Médio prazo

- backup e restore testados
- observabilidade de segurança
- revisão periódica de permissões admin
- checklist de produção segura
