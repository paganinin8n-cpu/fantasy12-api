import { Request, Response } from 'express';
import { ProcessMpSubscriptionCreatedService } from '../../services/subscription/process-mp-subscription-created.service';
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const event = req.body;
    const timestamp = new Date().toISOString();

    console.info({
      level: 'INFO',
      service: 'MercadoPagoWebhookController',
      action: 'webhook.received',
      provider: 'MERCADO_PAGO',
      externalEventId: event?.id,
      message: 'Webhook recebido',
      timestamp,
    });

    try {
      if (event?.type === 'subscription') {
        if (event?.action === 'subscription.created') {
          console.info({
            level: 'INFO',
            service: 'MercadoPagoWebhookController',
            action: 'subscription.created',
            externalEventId: event?.id,
            message: 'Processando subscription.created',
            timestamp,
          });

          await ProcessMpSubscriptionCreatedService.execute(event);
        }
      }

      if (event?.type === 'payment') {
        try {
          await ProcessMercadoPagoWebhookService.execute(event);
        } catch {
          console.warn({
            level: 'WARN',
            service: 'MercadoPagoWebhookController',
            action: 'payment.test_ignored',
            paymentId: event?.data?.id,
            message: 'Pagamento de teste ignorado',
            timestamp,
          });
        }
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error({
        level: 'ERROR',
        service: 'MercadoPagoWebhookController',
        action: 'webhook.error',
        message: 'Erro inesperado no webhook',
        error,
        timestamp,
      });

      return res.status(500).json({ error: 'webhook_failed' });
    }
  }
}
