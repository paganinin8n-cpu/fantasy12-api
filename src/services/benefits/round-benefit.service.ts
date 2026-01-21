import { prisma } from '../../lib/prisma';
import { SubscriptionService } from '../subscription/subscription.service';

export class RoundBenefitService {
  static async grantForRound(roundId: string) {
    const users = await prisma.user.findMany({
      select: { id: true, role: true },
    });

    for (const user of users) {
      let freeDoubles = 0;
      let freeSuperDoubles = 0;

      if (user.role === 'NORMAL') {
        freeDoubles = 2;
      }

      if (user.role === 'PRO') {
        freeDoubles = 4;
        freeSuperDoubles = 1;
      }

      await prisma.roundBenefit.create({
        data: {
          userId: user.id,
          roundId,
          freeDoubles,
          freeSuperDoubles,
        },
      });
    }
  }

  static async get(userId: string, roundId: string) {
    return prisma.roundBenefit.findUnique({
      where: { userId_roundId: { userId, roundId } },
    });
  }
}
