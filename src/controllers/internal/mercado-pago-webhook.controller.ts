import { Request, Response } from 'express';
import { ProcessMpSubscriptionCreatedService } from '../../services/subscription/process-mp-subscription-created.service';
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const event = req.body;

    try {
      /**
       * Mercado Pago envia múltiplos tipos no mesmo endpoint
       */
      if (event?.type === 'subscription') {
        if (event?.action === 'subscription.created') {
          await ProcessMpSubscriptionCreatedService.execute(event);
        }
      }

      if (event?.type === 'payment') {
        await ProcessMercadoPagoWebhookService.execute(event);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[MP WEBHOOK ERROR]', error);
      return res.status(500).json({ error: 'webhook_failed' });
    }
  }
}
