import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

export class CreatePaymentService {
  static async execute(params: {
    userId: string;
    amountCents: number;
    coinsAmount: number;
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
        amountCents: params.amountCents,
        coinsAmount: params.coinsAmount,
        externalReference,
      },
    });

    return {
      paymentId: payment.id,
      externalReference,
    };
  }
}
