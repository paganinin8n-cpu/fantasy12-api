import { Request, Response } from 'express';
import { ProcessMpSubscriptionCreatedService } from '../../services/subscription/process-mp-subscription-created.service';

export class MercadoPagoSubscriptionController {
  static async handle(req: Request, res: Response) {
    /**
     * Mercado Pago envia vários tipos de eventos.
     * Aqui tratamos SOMENTE subscription.created
     */
    const event = req.body;

    if (event?.type !== 'subscription' || event?.action !== 'subscription.created') {
      return res.status(200).json({ ignored: true });
    }

    await ProcessMpSubscriptionCreatedService.execute(event);

    return res.status(200).json({ received: true });
  }
}
