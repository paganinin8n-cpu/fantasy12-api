import { Request, Response, NextFunction } from 'express'
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service'
import { logger } from '../../lib/logger'
import { safeErrorForLog } from '../../security/privacy'

export class MercadoPagoWebhookController {
  static async handle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    const legacyPaymentId =
      req.query.topic === 'payment' && typeof req.query.id === 'string'
        ? req.query.id
        : null
    const event = legacyPaymentId
      ? {
          id: `legacy-payment-${legacyPaymentId}`,
          type: 'payment',
          data: { id: legacyPaymentId },
        }
      : req.body
    const timestamp = new Date().toISOString()

    logger.info({
      action: 'webhook.received',
      provider: 'MERCADO_PAGO',
      externalEventId: event?.id,
      timestamp,
    }, 'Webhook recebido')

    try {
      if (event?.type === 'payment') {
        await ProcessMercadoPagoWebhookService.execute(event)
      }

      return res.status(200).json({ received: true })
    } catch (error) {
      logger.error({
        action: 'webhook.error',
        err: safeErrorForLog(error),
        timestamp,
      }, 'Falha ao processar webhook')

      return next(error)
    }
  }
}
