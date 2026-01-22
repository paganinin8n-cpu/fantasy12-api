import { Request, Response } from 'express';
import { CreatePaymentService } from '../services/payment/create-payment.service';

export class PaymentController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { amountCents, coinsAmount, method } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amountCents || !coinsAmount || !method) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    try {
      const payment = await CreatePaymentService.execute({
        userId,
        amountCents,
        coinsAmount,
        method,
      });

      return res.status(201).json(payment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
