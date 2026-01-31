import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

export class CreatePaymentService {
  static async execute(params: {
    userId: string;
    packageId: string;        // ✅ obrigatório
    amountCents: number;
    coinsAmount: number;
    bonusCoins?: number;      // ✅ opcional
    method: 'PIX' | 'CARD';
  }) {
    const paymentId = randomUUID();
    const externalReference = `f12_${paymentId}`;

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        userId: params.userId,

        provider: 'MERCADO_PAGO',
        method: params.method,
        status: 'PENDING',

        packageId: params.packageId,          // ✅ CORREÇÃO
        amountCents: params.amountCents,
        coinsAmount: params.coinsAmount,
        bonusCoins: params.bonusCoins ?? 0,   // ✅ CORREÇÃO

        externalReference,
      },
    });

    return {
      paymentId: payment.id,
      externalReference,
    };
  }
}
