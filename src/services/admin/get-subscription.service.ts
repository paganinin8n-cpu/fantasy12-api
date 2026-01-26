import { prisma } from '../../lib/prisma';

/**
 * Service READ-ONLY para recuperação de assinatura
 *
 * Objetivo:
 * - Centralizar leitura de assinatura
 * - Evitar duplicação em jobs e alertas
 * - NÃO altera estado
 * - NÃO aplica regra de negócio
 */
export class GetSubscriptionService {
  static async byUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  }

  static async bySubscriptionId(subscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  }
}
