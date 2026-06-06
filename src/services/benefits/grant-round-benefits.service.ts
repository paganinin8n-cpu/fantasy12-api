import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription, hasAnnualProSubscription } from '../../domain/subscription';
import { getRoundBenefitGrant } from './benefits.config';

/**
 * Concede extras gratuitos por rodada.
 *
 * REGRAS CANÔNICAS:
 * - NORMAL: 2 DOUBLE por rodada
 * - PRO: 4 DOUBLE + 2 SUPER_DOUBLE por rodada
 * - Sempre reseta a cada rodada
 */
export class GrantRoundBenefitsService {
  static async execute(roundId: string): Promise<void> {
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
      const isPro = hasActiveProSubscription(user.subscription);
      const grant = getRoundBenefitGrant({
        isPro,
        isAnnualPro: hasAnnualProSubscription(user.subscription),
      });

      await prisma.roundBenefit.upsert({
        where: {
          userId_roundId: {
            userId: user.id,
            roundId,
          },
        },
        update: {
          freeDoubles: grant.freeDoubles,
          freeSuperDoubles: grant.freeSuperDoubles,
        },
        create: {
          userId: user.id,
          roundId,
          freeDoubles: grant.freeDoubles,
          freeSuperDoubles: grant.freeSuperDoubles,
        },
      });
    }
  }
}
