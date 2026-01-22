import { Request, Response } from 'express';
import { ProcessMercadoPagoWebhookService } from '../../services/mercado-pago/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response) {
    try {
      await ProcessMercadoPagoWebhookService.execute({
        headers: req.headers,
        body: req.body,
      });

      // ⚠️ O Mercado Pago EXIGE 200 rápido
      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[MP WEBHOOK ERROR]', error.message);
      return res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
}
