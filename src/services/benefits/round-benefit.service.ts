import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';

export class RoundBenefitService {
  static async grantForRound(roundId: string) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            endAt: true,
          },
        },
      },
    });

    for (const user of users) {
      const isPro = hasActiveProSubscription(user.subscription)
      let freeDoubles = 0;
      let freeSuperDoubles = 0;

      if (!isPro) {
        freeDoubles = 2;
      }

      if (isPro) {
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
