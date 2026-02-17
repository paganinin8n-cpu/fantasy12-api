import { prisma } from '../../lib/prisma';

export class GetWalletService {
  static async execute(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      return {
        balance: 0,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      balance: wallet.balance,
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }
}
