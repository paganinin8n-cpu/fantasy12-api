import { prisma } from '../../lib/prisma'
import { WalletTransactionType } from '@prisma/client'

export class WalletService {
  static async getOrCreateWallet(userId: string) {
    return prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  }

  /**
   * ⚠️ Uso restrito:
   * - Webhook de pagamento
   * - Consumo autorizado
   */
  static async credit(
    userId: string,
    amount: number,
    description?: string
  ) {
    return prisma.$transaction(async tx => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
      })

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.CREDIT,
          amount,
          description,
        },
      })

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      })

      return wallet
    })
  }

  /**
   * ⚠️ Uso restrito:
   * - Criação de ticket
   * - Ações pagas
   */
  static async debit(
    userId: string,
    amount: number,
    description?: string
  ) {
    return prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet balance')
      }

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEBIT,
          amount,
          description,
        },
      })

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      })

      return wallet
    })
  }
}
