import { prisma } from '../../lib/prisma'
import { WalletTransactionType, Prisma } from '@prisma/client'
import { AppError } from '../../errors/AppError'

export class WalletService {
  static async getOrCreateWallet(userId: string) {
    return prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })
  }

  /**
   * Crédito de coins
   * - Usado apenas por webhook de pagamento ou ações administrativas
   */
  static async credit(
    userId: string,
    amount: number,
    description?: string,
    tx?: Prisma.TransactionClient
  ) {
    // 👉 Se já estiver em transação, usa ela
    if (tx) {
      return WalletService.creditWithTx(tx, userId, amount, description)
    }

    // 👉 Caso contrário, abre transação
    return prisma.$transaction(async trx => {
      return WalletService.creditWithTx(trx, userId, amount, description)
    })
  }

  private static async creditWithTx(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    description?: string
  ) {
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
  }

  /**
   * Débito de coins
   * - Usado por tickets, benefícios pagos, etc.
   */
  static async debit(
    userId: string,
    amount: number,
    description?: string,
    tx?: Prisma.TransactionClient
  ) {
    if (tx) {
      return WalletService.debitWithTx(tx, userId, amount, description)
    }

    return prisma.$transaction(async trx => {
      return WalletService.debitWithTx(trx, userId, amount, description)
    })
  }

  private static async debitWithTx(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    description?: string
  ) {
    const wallet = await tx.wallet.findUnique({
      where: { userId },
    })

    if (!wallet || wallet.balance < amount) {
      throw AppError.badRequest(
        'Saldo de fichas insuficiente',
        'insufficient_wallet_balance',
        {
          required: amount,
          available: wallet?.balance ?? 0,
        }
      )
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
  }
}
