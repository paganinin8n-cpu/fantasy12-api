import { Request, Response } from 'express';
import { ProcessMpSubscriptionCreatedService } from '../../services/subscription/process-mp-subscription-created.service';
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const event = req.body;

    try {
      /**
       * Webhook de assinatura
       */
      if (event?.type === 'subscription') {
        if (event?.action === 'subscription.created') {
          await ProcessMpSubscriptionCreatedService.execute(event);
        }
      }

      /**
       * Webhook de pagamento
       */
      if (event?.type === 'payment') {
        try {
          await ProcessMercadoPagoWebhookService.execute(event);
        } catch (error) {
          /**
           * ⚠️ IMPORTANTE
           * Testes do Mercado Pago usam IDs fake.
           * Não podemos retornar 500 nesses casos.
           */
          console.warn('[MP PAYMENT TEST IGNORED]', {
            paymentId: event?.data?.id,
          });
        }
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[MP WEBHOOK ERROR]', error);
      return res.status(500).json({ error: 'webhook_failed' });
    }
  }
}
