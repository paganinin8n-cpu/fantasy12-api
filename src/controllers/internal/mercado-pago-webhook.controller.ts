import { Request, Response } from 'express';
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response) {
    try {
      await ProcessMercadoPagoWebhookService.execute(req.body);
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('[MP WEBHOOK ERROR]', error);
      // Importante: sempre responder 200 para o MP não re-tentar em loop
      return res.status(200).json({ received: true });
    }
  }
}
