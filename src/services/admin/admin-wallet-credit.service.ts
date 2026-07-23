import { prisma } from '../../lib/prisma';

export class AdminWalletCreditService {
  static async credit(
    adminUserId: string,
    userId: string,
    amount: number,
    reason: string
  ) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    return prisma.$transaction(async tx => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount,
          description: `ADMIN CREDIT: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'ADMIN_WALLET_CREDIT',
          entity: 'Wallet',
          entityId: wallet.id,
          metadata: { targetUserId: userId, amount, reason },
        },
      });

      return {
        userId,
        credited: amount,
        balanceAfter: wallet.balance + amount,
      };
    });
  }

  static async debit(
    adminUserId: string,
    userId: string,
    amount: number,
    reason: string
  ) {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    return prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < amount) {
        throw new Error('Saldo de fichas insuficiente');
      }

      const debit = await tx.wallet.updateMany({
        where: { id: wallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });

      if (debit.count !== 1) {
        throw new Error('Saldo de fichas insuficiente');
      }

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          description: `ADMIN DEBIT: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'ADMIN_WALLET_DEBIT',
          entity: 'Wallet',
          entityId: wallet.id,
          metadata: { targetUserId: userId, amount, reason },
        },
      });

      return {
        userId,
        debited: amount,
        balanceAfter: wallet.balance - amount,
      };
    });
  }
}
