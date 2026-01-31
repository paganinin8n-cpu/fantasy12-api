import { Request, Response } from 'express';
import { createPaymentService } from '../services/payment/create-payment.service';
import { prisma } from '../lib/prisma'; // 👈 Importe o prisma

export class PaymentController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { packageId, method } = req.body; // 👈 EXTRAIA packageId e method do body

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!packageId || !method) {
      return res.status(400).json({ error: 'packageId and method are required' });
    }

    try {
      // 👇 BUSQUE O PACOTE NO BANCO
      const pkg = await prisma.paymentPackage.findUnique({
        where: { id: packageId },
      });

      // 👇 VALIDE SE O PACOTE EXISTE E ESTÁ ATIVO
      if (!pkg || !pkg.isActive) {
        return res.status(400).json({ error: 'Invalid or inactive package' });
      }

      // 👇 AGORA SIM, CRIE O PAGAMENTO COM OS DADOS DO PACOTE
      const payment = await createPaymentService({
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