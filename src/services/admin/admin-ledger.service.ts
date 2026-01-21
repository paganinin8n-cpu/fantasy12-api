import { prisma } from '../../lib/prisma';

export class AdminLedgerService {
  static async listByUser(userId: string) {
    return prisma.walletLedger.findMany({
      where: {
        wallet: { userId },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        amount: true,
        description: true,
        createdAt: true,
      },
    });
  }
}
