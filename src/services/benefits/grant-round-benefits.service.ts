import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';

/**
 * Concede benefícios FREE por rodada.
 *
 * REGRAS CANÔNICAS:
 * - FREE NÃO acumula
 * - NORMAL: 2 DOUBLE
 * - PRO: 4 DOUBLE + 1 SUPER_DOUBLE
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
            endAt: true,
          },
        },
      },
    });

    for (const user of users) {
      const isPro = hasActiveProSubscription(user.subscription)
      const freeDoubles =
        isPro ? 4 : 2;

      const freeSuperDoubles =
        isPro ? 1 : 0;

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
