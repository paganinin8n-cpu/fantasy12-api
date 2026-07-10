type MercadoPagoEvent = {
  id?: string | number | null
  data?: { id?: string | number | null } | null
}

type LocalPaymentForValidation = {
  amountCents: number
  externalReference: string | null
}

type MercadoPagoPaymentForValidation = {
  transaction_amount?: number | null
  currency_id?: string | null
  external_reference?: string | null
}

export function normalizeMercadoPagoPaymentEvent(event: MercadoPagoEvent) {
  if (event.id == null || event.data?.id == null) return null

  return {
    externalEventId: String(event.id),
    externalPaymentId: String(event.data.id),
  }
}

export function validateMercadoPagoPayment(
  payment: LocalPaymentForValidation,
  mercadoPagoPayment: MercadoPagoPaymentForValidation
): { valid: true } | { valid: false; reason: string } {
  if (mercadoPagoPayment.currency_id !== 'BRL') {
    return { valid: false, reason: 'currency_mismatch' }
  }

  const receivedAmountCents = Math.round(
    Number(mercadoPagoPayment.transaction_amount) * 100
  )
  if (
    !Number.isFinite(receivedAmountCents) ||
    receivedAmountCents !== payment.amountCents
  ) {
    return { valid: false, reason: 'amount_mismatch' }
  }

  if (mercadoPagoPayment.external_reference !== payment.externalReference) {
    return { valid: false, reason: 'external_reference_mismatch' }
  }

  return { valid: true }
}

export function getMercadoPagoNotificationUrl() {
  const explicit = process.env.MP_NOTIFICATION_URL?.trim()
  if (explicit) return explicit

  const apiUrl = process.env.API_PUBLIC_URL?.trim()?.replace(/\/+$/, '')
  return apiUrl ? `${apiUrl}/internal/webhooks/mercado-pago` : undefined
}

export function getMercadoPagoCheckoutUrl(
  preference: Record<string, any>,
  accessToken: string
) {
  if (
    accessToken.startsWith('TEST-') &&
    process.env.MP_USE_SANDBOX_INIT_POINT === 'true'
  ) {
    return preference.sandbox_init_point ?? preference.init_point ?? null
  }

  return preference.init_point ?? preference.sandbox_init_point ?? null
}

export function getMercadoPagoPaymentMethods(method: 'PIX' | 'CARD') {
  if (method === 'PIX') {
    return {
      installments: 1,
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'prepaid_card' },
        { id: 'ticket' },
        { id: 'atm' },
      ],
    }
  }

  return {
    excluded_payment_types: [
      { id: 'bank_transfer' },
      { id: 'ticket' },
      { id: 'atm' },
    ],
  }
}
