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
