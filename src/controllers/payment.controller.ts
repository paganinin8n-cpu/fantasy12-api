import { Request, Response } from 'express';
import { CreatePaymentService } from '../services/payment/create-payment.service'; // 👈 Maiúscula
import { prisma } from '../lib/prisma';

export class PaymentController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { packageId, method } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!packageId || !method) {
      return res.status(400).json({ error: 'packageId and method are required' });
    }

    try {
      const pkg = await prisma.paymentPackage.findUnique({
        where: { id: packageId },
      });

      if (!pkg || !pkg.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive package' });
      }

      const payment = await CreatePaymentService({ // 👈 Maiúscula
        userId,
        packageId: pkg.id,
        amountCents: pkg.amountCents,
        coinsAmount: pkg.coinsAmount,
        bonusCoins: pkg.bonusCoins,
        method,
      });

      return res.status(201).json(payment);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}