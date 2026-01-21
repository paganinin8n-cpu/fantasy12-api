import { prisma } from '../../lib/prisma';

export class WalletService {
  static async getOrCreateWallet(userId: string) {
    return prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  static async credit(userId: string, amount: Int, description?: string) {
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
          description,
        },
      });

      return wallet;
    });
  }

  static async debit(userId: string, amount: Int, description?: string) {
    return prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } },
      });

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount,
          description,
        },
      });

      return wallet;
    });
  }
}
