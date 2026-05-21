import { prisma } from '../../lib/prisma';

/**
 * Concede extras fixos por rodada.
 *
 * REGRAS CANÔNICAS:
 * - 4 DOUBLE por rodada
 * - 2 SUPER_DOUBLE por rodada
 * - Não depende de perfil ou assinatura
 * - Sempre reseta a cada rodada
 */
export class GrantRoundBenefitsService {
  static async execute(roundId: string): Promise<void> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    });

    for (const user of users) {
      const freeDoubles = 4;
      const freeSuperDoubles = 2;

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
