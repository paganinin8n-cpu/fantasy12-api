import { prisma } from '../../lib/prisma';
import { WalletService } from '../wallet/wallet.service';

type ConsumeInput = {
  userId: string;
  roundId: string;
  type: 'DOUBLE' | 'SUPER_DOUBLE';
};

export class ConsumeBenefitsService {
  static async execute({ userId, roundId, type }: ConsumeInput) {
    return prisma.$transaction(async tx => {
      const benefit = await tx.roundBenefit.findUnique({
        where: { userId_roundId: { userId, roundId } },
      });

      if (!benefit) {
        throw new Error('Round benefits not found');
      }

      // 1️⃣ Consumir FREE primeiro
      if (type === 'DOUBLE' && benefit.freeDoubles > 0) {
        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: { freeDoubles: { decrement: 1 } },
        });
        return { consumed: 'FREE_DOUBLE' };
      }

      if (type === 'SUPER_DOUBLE' && benefit.freeSuperDoubles > 0) {
        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: { freeSuperDoubles: { decrement: 1 } },
        });
        return { consumed: 'FREE_SUPER_DOUBLE' };
      }

      // 2️⃣ Consumir COMPRADO (coins)
      const cost = type === 'DOUBLE' ? 1 : 2; // regra de preço técnico (ajustável)

      await WalletService.debit(
        userId,
        cost,
        `Consume ${type} on round ${roundId}`
      );

      return { consumed: 'PAID', cost };
    });
  }
}
