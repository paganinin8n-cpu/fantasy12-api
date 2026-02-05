import { prisma } from '../../lib/prisma';
import { UserRole } from '@prisma/client';

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
        role: true,
      },
    });

    for (const user of users) {
      const freeDoubles =
        user.role === UserRole.PRO ? 4 : 2;

      const freeSuperDoubles =
        user.role === UserRole.PRO ? 1 : 0;

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
