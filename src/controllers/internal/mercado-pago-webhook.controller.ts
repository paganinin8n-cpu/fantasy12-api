import { Request, Response } from 'express'
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service'

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const event = req.body
    const timestamp = new Date().toISOString()

    console.info({
      level: 'INFO',
      service: 'MercadoPagoWebhookController',
      action: 'webhook.received',
      provider: 'MERCADO_PAGO',
      externalEventId: event?.id,
      timestamp,
    })

    try {
      if (event?.type === 'payment') {
        await ProcessMercadoPagoWebhookService.execute(event)
      }

      return res.status(200).json({ received: true })
    } catch (error) {
      console.error({
        level: 'ERROR',
        service: 'MercadoPagoWebhookController',
        action: 'webhook.error',
        error,
        timestamp,
      })

      // Webhook SEMPRE responde 200
      return res.status(200).json({ error: 'error_logged' })
    }
  }
}
