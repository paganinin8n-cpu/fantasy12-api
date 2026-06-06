# Runbook Operacional

Ultima atualizacao:

- 2026-06-06

## Verificacoes rapidas

1. Validar API:
   - `GET https://api.fantasy12.com/health`
   - esperado: `api: ok`, `db: ok`
2. Validar painel:
   - abrir `Admin > Operacao`
   - verificar estado geral `OK`, `WARN` ou `CRITICAL`
3. Conferir logs:
   - abrir `Admin > Logs`
   - filtrar entidades relacionadas ao incidente, como `WALLET`, `ROUND`, `USER` ou `SYSTEM`
4. Conferir jobs:
   - abrir `Admin > Operacao`
   - verificar `failedLast24h`, `runningOver30m` e `lastExecution`
5. Conferir alerta externo:
   - `OPERATIONS_ALERT_WEBHOOK_URL` configurado indica que anomalias tambem sao enviadas para canal externo

## Sinais criticos

- `mp_access_token_missing`
  - checkout Mercado Pago fica desabilitado
  - configurar `MP_ACCESS_TOKEN` no serviço `api` e redeployar
  - para credenciais de teste, usar token `TEST-...`; o backend usa `init_point` por padrão e só força `sandbox_init_point` se `MP_USE_SANDBOX_INIT_POINT=true`
- `approved_payment_not_credited`
  - pagamento aprovado sem crédito na wallet
  - conferir webhook recebido e reconciliar pagamento antes de creditar manualmente
- `active_subscription_past_end`
  - assinatura marcada como ativa apesar da vigencia encerrada
  - rodar revalidacao de assinaturas e revisar status no admin
- `internal_job_failed_last_24h`
  - um job interno falhou nas ultimas 24h
  - abrir `Admin > Operacao`, identificar `lastExecution` e conferir `InternalJobExecution`
- `internal_job_stuck_over_30m`
  - existe job `RUNNING` ha mais de 30 minutos
  - validar se ha execucao real em andamento antes de repetir o job

## Sinais de aviso

- `stale_pending_payments`
  - pagamentos pendentes ha mais de 30 minutos
  - pode ser normal em PIX/cartao pendente, mas deve ser acompanhado
- `webhook_high_volume`
  - volume alto de webhooks em 5 minutos
  - conferir duplicidade, retries do gateway ou comportamento anormal
- `mp_webhook_secret_missing`
  - webhook fica menos protegido
  - configurar `MP_WEBHOOK_SECRET` em producao
  - para teste sandbox, `MP_ALLOW_UNSIGNED_TEST_WEBHOOKS=true` pode ser usado somente com token `TEST-...`
- `mp_notification_url_not_explicit`
  - a URL de notificacao depende da configuracao do app Mercado Pago ou nao esta explicita no ambiente
  - configurar `API_PUBLIC_URL=https://api.fantasy12.com` ou `MP_NOTIFICATION_URL`

## Jobs internos

Todos os jobs internos devem receber `x-internal-job-token` com o valor de `INTERNAL_JOB_SECRET`.

- `POST /internal/jobs/score-round`
  - body: `{ "roundId": "..." }`
  - idempotente por `roundId`
- `POST /internal/jobs/open-round`
  - body: `{ "roundId": "..." }`
  - idempotente por `roundId`
- `POST /internal/jobs/close-expired-rankings`
  - idempotente por dia
- `POST /internal/jobs/subscriptions/revalidate`
  - idempotente por hora
- `POST /internal/jobs/alerts/run`
  - idempotente por minuto
  - executa as deteccoes de pagamento, webhook, assinatura e jobs

## Teste de incidente

1. Rodar `GET /api/admin/operational/status` com sessao admin.
2. Confirmar que `configuration.operationsAlertWebhookConfigured` reflete o ambiente.
3. Rodar `POST /internal/jobs/alerts/run` com `x-internal-job-token`.
4. Validar resposta `status: ok` e `execution.status`.
5. Abrir `Admin > Logs` e filtrar `InternalJobExecution` para conferir `INTERNAL_JOB_STARTED` e `INTERNAL_JOB_FINISHED`.
6. Se `OPERATIONS_ALERT_WEBHOOK_URL` estiver configurado e houver anomalia, conferir recebimento no canal externo.

## Pos-deploy minimo

1. Validar `/health`.
2. Validar login admin.
3. Abrir `Admin > Operacao`.
4. Conferir se o estado geral condiz com a mudanca feita.
5. Em mudancas de pagamento/assinatura, validar endpoints autenticados e acompanhar webhooks.
