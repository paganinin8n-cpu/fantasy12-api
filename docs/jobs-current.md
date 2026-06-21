# Jobs Atuais

## Princípios confirmados no código

- protegidos por `x-internal-job-token` nas rotas críticas
- orientados a execução idempotente
- suportados por estruturas de rastreio no domínio

## Rotas internas atuais

### Score da rodada

- `POST /internal/jobs/score-round`

Responsabilidade:

- apurar rodada
- calcular score
- atualizar histórico relacionado

### Fechamento de rankings expirados

- `POST /internal/jobs/close-expired-rankings`

Responsabilidade:

- fechar rankings vencidos

### Abertura de rodada

- `POST /internal/jobs/open-round`

Responsabilidade:

- abrir rodada
- conceder benefícios FREE da rodada

### Abertura automatica de rodadas agendadas

- `POST /internal/jobs/open-scheduled-rounds`

Responsabilidade:

- localizar a primeira rodada `DRAFT` com `openAt <= now`
- respeitar a regra de uma unica rodada `OPEN`
- abrir a rodada via `OpenRoundService`
- conceder beneficios FREE da rodada

Frequencia recomendada em producao:

- a cada 1 minuto

### Fechamento automatico de palpites agendados

- `POST /internal/jobs/close-scheduled-rounds`

Responsabilidade:

- localizar rodadas `OPEN` com `closeAt <= now`
- fechar somente a janela de palpites (`OPEN -> CLOSED`)
- manter a apuracao manual no fluxo administrativo

Frequencia recomendada em producao:

- a cada 1 minuto

### Revalidação de assinaturas

- `POST /internal/jobs/subscriptions/revalidate`

Responsabilidade:

- revalidar assinaturas ativas

## Webhook atual

### Mercado Pago

- `POST /internal/webhooks/mercado-pago`

Responsabilidade:

- receber eventos externos do provedor
- delegar processamento financeiro

## Divergências em relação ao documento externo `JOBS.md`

- `process-round` hoje aparece como `score-round`
- `generate-ranking` não aparece como rota dedicada com esse nome
- o webhook atual não é `/payment`, e sim `/mercado-pago`
