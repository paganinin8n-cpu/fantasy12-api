
import { prisma } from '@/lib/prisma'

export class ListPaymentHistoryService {
  static async execute(userId: string) {
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        amountCents: true,
        coinsAmount: true,
        bonusCoins: true,
        method: true,
        provider: true,
        createdAt: true,
      },
    })

    return payments.map(payment => ({
      id: payment.id,
      status: payment.status,
      amountCents: payment.amountCents,
      coinsAmount: payment.coinsAmount,
      bonusCoins: payment.bonusCoins,
      method: payment.method,
      provider: payment.provider,
      createdAt: payment.createdAt.toISOString(),
    }))
  }
}
