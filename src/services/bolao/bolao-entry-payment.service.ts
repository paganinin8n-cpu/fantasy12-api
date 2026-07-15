import { Prisma } from '@prisma/client'

export class BolaoEntryPaymentService {
  static async debit(
    tx: Prisma.TransactionClient,
    input: { rankingId: string; userId: string; amount: number }
  ) {
    const wallet = await tx.wallet.findUnique({
      where: { userId: input.userId },
      select: { id: true, balance: true },
    })

    if (!wallet || wallet.balance < input.amount) {
      throw new Error('Participante não possui fichas suficientes para entrar nesta Mesa')
    }

    const debit = await tx.wallet.updateMany({
      where: { id: wallet.id, balance: { gte: input.amount } },
      data: { balance: { decrement: input.amount } },
    })
    if (debit.count !== 1) {
      throw new Error('Participante não possui fichas suficientes para entrar nesta Mesa')
    }

    await tx.walletLedger.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount: input.amount,
        description: `Entrada na Mesa ${input.rankingId}`,
        idempotencyKey: `bolao:entry:${input.rankingId}:${input.userId}`,
      },
    })
  }
}
