import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription, hasAnnualProSubscription } from '../../domain/subscription';
import { getRoundBenefitGrant } from './benefits.config';

export class RoundBenefitService {
  static async grantForRound(roundId: string) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            endAt: true,
          },
        },
      },
    });

    for (const user of users) {
      const grant = getRoundBenefitGrant({
        isPro: hasActiveProSubscription(user.subscription),
        isAnnualPro: hasAnnualProSubscription(user.subscription),
      });

      await prisma.roundBenefit.create({
        data: {
          userId: user.id,
          roundId,
          freeDoubles: grant.freeDoubles,
          freeSuperDoubles: grant.freeSuperDoubles,
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
