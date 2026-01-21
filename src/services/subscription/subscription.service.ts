import { prisma } from '../../lib/prisma';

export class SubscriptionService {
  static async createOrRenew(userId: string, plan: 'MONTHLY' | 'ANNUAL') {
    const startAt = new Date();
    const endAt = new Date(startAt);

    if (plan === 'MONTHLY') {
      endAt.setMonth(endAt.getMonth() + 1);
    } else {
      endAt.setFullYear(endAt.getFullYear() + 1);
    }

    return prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        startAt,
        endAt,
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        startAt,
        endAt,
      },
    });
  }

  static async isProActive(userId: string): Promise<boolean> {
    const sub = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endAt: { gt: new Date() },
      },
    });

    return !!sub;
  }
}
