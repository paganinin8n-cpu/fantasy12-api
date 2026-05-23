import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';

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
        role: true,
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
      const isPro = hasActiveProSubscription(user.subscription) || user.role === 'PRO';
      const freeDoubles = isPro ? 4 : 2;
      const freeSuperDoubles = isPro ? 2 : 0;

      await prisma.roundBenefit.upsert({
        where: {
          userId_roundId: {
            userId: user.id,
            roundId,
          },
        },
        update: {
          freeDoubles,
          freeSuperDoubles,
        },
        create: {
          userId: user.id,
          roundId,
          freeDoubles,
          freeSuperDoubles,
        },
      });
    }
  }
}
