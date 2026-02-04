import { prisma } from '../../lib/prisma'
import { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client'

interface PaymentHistoryItem {
  id: string
  status: PaymentStatus
  amountCents: number
  coinsAmount: number
  bonusCoins: number
  method: PaymentMethod
  provider: PaymentProvider
  createdAt: string
}

export class ListPaymentHistoryService {
  static async execute(userId: string): Promise<PaymentHistoryItem[]> {
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
