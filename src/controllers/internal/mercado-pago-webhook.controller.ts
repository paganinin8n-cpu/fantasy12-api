import { Request, Response } from 'express';

import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';
import { ProcessMpSubscriptionCreatedService } from '../../services/subscription/process-mp-subscription-created.service';
import { ProcessMpSubscriptionUpdatedService } from '../../services/subscription/process-mp-subscription-updated.service';
import { ProcessMpSubscriptionCancelledService } from '../../services/subscription/process-mp-subscription-cancelled.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const event = req.body;

    try {
      /**
       * ===============================
       * ASSINATURAS (PREAPPROVAL)
       * ===============================
       */
      if (event?.type === 'preapproval') {
        switch (event?.action) {
          case 'preapproval.created':
            await ProcessMpSubscriptionCreatedService.execute(event);
            break;

          case 'preapproval.updated':
            await ProcessMpSubscriptionUpdatedService.execute(event);
            break;

          case 'preapproval.cancelled':
            await ProcessMpSubscriptionCancelledService.execute(event);
            break;

          default:
            // Evento de assinatura não relevante
            break;
        }
      }

      /**
       * ===============================
       * PAGAMENTOS (PIX / CARTÃO)
       * ===============================
       */
      if (event?.type === 'payment') {
        await ProcessMercadoPagoWebhookService.execute(event);
      }

      /**
       * ⚠️ IMPORTANTE:
       * SEMPRE retornar 200 para o MP
       */
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[MP WEBHOOK ERROR]', error);
      return res.status(500).json({ error: 'webhook_failed' });
    }
  }
}
