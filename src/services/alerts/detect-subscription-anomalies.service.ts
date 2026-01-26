import { prisma } from '../../lib/prisma';

export class DetectSubscriptionAlertsService {
  static async execute(): Promise<void> {
    const timestamp = new Date().toISOString();

    const inconsistencies = await prisma.subscription.findMany({
      where: {
        OR: [
          {
            status: 'ACTIVE',
            user: { role: 'NORMAL' },
          },
          {
            status: { in: ['CANCELLED', 'EXPIRED'] },
            user: { role: 'PRO' },
          },
        ],
      },
      include: {
        user: true,
      },
    });

    for (const sub of inconsistencies) {
      console.error({
        level: 'CRITICAL',
        service: 'DetectSubscriptionAlertsService',
        action: 'subscription.role_mismatch',
        subscriptionId: sub.id,
        userId: sub.userId,
        message: `Inconsistência assinatura (${sub.status}) x papel (${sub.user.role})`,
        timestamp,
      });
    }
  }
}
