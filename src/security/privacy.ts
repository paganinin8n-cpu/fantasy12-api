const SENSITIVE_KEY =
  /(authorization|cookie|password|token|secret|signature|cpf|phone)/i

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const [local, domain] = email.split('@')
  if (!local || !domain) return '[redacted-email]'
  return `${local.slice(0, 1)}***@${domain}`
}

export function maskCpf(cpf: string | null | undefined): string | null {
  if (!cpf) return null
  return `***.***.***-${cpf.replace(/\D/g, '').slice(-2)}`
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null
  return `********${phone.replace(/\D/g, '').slice(-4)}`
}

export function safeErrorForLog(error: unknown) {
  if (!(error instanceof Error)) return { name: 'UnknownError' }
  const code =
    'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined
  return {
    name: error.name,
    ...(code ? { code } : {}),
  }
}

export function redactSensitiveMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveMetadata)
  }
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (/email/i.test(key)) {
        return [key, typeof entry === 'string' ? maskEmail(entry) : '[redacted]']
      }
      if (SENSITIVE_KEY.test(key)) return [key, '[redacted]']
      return [key, redactSensitiveMetadata(entry)]
    })
  )
}

export function minimizeMercadoPagoPayload(
  payload: Record<string, unknown>
): Record<string, string | number | boolean> {
  const allowedKeys = [
    'id',
    'status',
    'external_reference',
    'transaction_amount',
    'currency_id',
    'date_approved',
    'payment_method_id',
    'payment_type_id',
    'live_mode',
    'reason',
    'payer_id',
    'start_date',
    'end_date',
    'date_created',
    'last_modified',
  ] as const

  return Object.fromEntries(
    allowedKeys.flatMap(key => {
      const entry = payload[key]
      return typeof entry === 'string' ||
        typeof entry === 'number' ||
        typeof entry === 'boolean'
        ? [[key, entry]]
        : []
    })
  )
}
