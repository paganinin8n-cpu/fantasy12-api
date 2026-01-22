import { Request, Response } from 'express';
import { ProcessMercadoPagoWebhookService } from '../../services/payment/process-mercado-pago-webhook.service';

export class MercadoPagoWebhookController {
  static async handle(req: Request, res: Response) {
    await ProcessMercadoPagoWebhookService.execute(req.body);
    return res.status(200).json({ received: true });
  }
}
