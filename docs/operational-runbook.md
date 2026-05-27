# Runbook Operacional

Ultima atualizacao:

- 2026-05-25

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

## Sinais criticos

- `mp_access_token_missing`
  - checkout Mercado Pago fica desabilitado
  - configurar `MP_ACCESS_TOKEN` no serviço `api` e redeployar
  - para credenciais de teste, usar token `TEST-...`; o backend usa `sandbox_init_point`
- `approved_payment_not_credited`
  - pagamento aprovado sem crédito na wallet
  - conferir webhook recebido e reconciliar pagamento antes de creditar manualmente
- `active_subscription_past_end`
  - assinatura marcada como ativa apesar da vigencia encerrada
  - rodar revalidacao de assinaturas e revisar status no admin

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
- `mp_notification_url_not_explicit`
  - a URL de notificacao depende da configuracao do app Mercado Pago ou nao esta explicita no ambiente
  - configurar `API_PUBLIC_URL=https://api.fantasy12.com` ou `MP_NOTIFICATION_URL`

## Pos-deploy minimo

1. Validar `/health`.
2. Validar login admin.
3. Abrir `Admin > Operacao`.
4. Conferir se o estado geral condiz com a mudanca feita.
5. Em mudancas de pagamento/assinatura, validar endpoints autenticados e acompanhar webhooks.
