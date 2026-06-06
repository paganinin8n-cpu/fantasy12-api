type AlertLevel = 'INFO' | 'WARN' | 'CRITICAL'

type AlertPayload = {
  level: AlertLevel
  service: string
  action: string
  message: string
  timestamp?: string
  data?: Record<string, unknown>
}

export class AlertDispatcherService {
  static isExternalConfigured() {
    return Boolean(process.env.OPERATIONS_ALERT_WEBHOOK_URL)
  }

  static async dispatch(alert: AlertPayload) {
    const payload = {
      ...alert,
      timestamp: alert.timestamp ?? new Date().toISOString(),
    }

    const log = alert.level === 'CRITICAL' ? console.error : console.warn
    log(payload)

    if (!process.env.OPERATIONS_ALERT_WEBHOOK_URL) {
      return { delivered: false, reason: 'not_configured' as const }
    }

    try {
      const response = await fetch(process.env.OPERATIONS_ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      return {
        delivered: response.ok,
        status: response.status,
      }
    } catch (error: any) {
      console.error({
        level: 'CRITICAL',
        service: 'AlertDispatcherService',
        action: 'alert.external_delivery_failed',
        message: 'Falha ao enviar alerta externo',
        error: error?.message,
        timestamp: new Date().toISOString(),
      })

      return {
        delivered: false,
        reason: 'delivery_failed' as const,
      }
    }
  }
}
