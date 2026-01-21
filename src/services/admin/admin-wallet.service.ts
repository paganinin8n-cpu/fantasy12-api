import { prisma } from '../../lib/prisma';

export class AdminWalletService {
  static async getWalletByUser(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
      select: {
        userId: true,
        balance: true,
        updatedAt: true,
      },
    });
  }
}
