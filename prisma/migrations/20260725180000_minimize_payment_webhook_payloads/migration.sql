-- SEC-010 V1: remove provider fields that are unnecessary for processing,
-- reconciliation, or audit. JSONB_STRIP_NULLS keeps the stored object compact.
UPDATE "payment_webhook_events"
SET "payload" = JSONB_STRIP_NULLS(
  JSONB_BUILD_OBJECT(
    'id', "payload"->'id',
    'status', "payload"->'status',
    'external_reference', "payload"->'external_reference',
    'transaction_amount', "payload"->'transaction_amount',
    'currency_id', "payload"->'currency_id',
    'date_approved', "payload"->'date_approved',
    'payment_method_id', "payload"->'payment_method_id',
    'payment_type_id', "payload"->'payment_type_id',
    'live_mode', "payload"->'live_mode',
    'reason', "payload"->'reason',
    'payer_id', "payload"->'payer_id',
    'start_date', "payload"->'start_date',
    'end_date', "payload"->'end_date',
    'date_created', "payload"->'date_created',
    'last_modified', "payload"->'last_modified'
  )
);
