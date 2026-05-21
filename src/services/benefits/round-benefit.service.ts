import { prisma } from '../../lib/prisma';

export class RoundBenefitService {
  static async grantForRound(roundId: string) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    });

    for (const user of users) {
      await prisma.roundBenefit.create({
        data: {
          userId: user.id,
          roundId,
          freeDoubles: 4,
          freeSuperDoubles: 2,
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
