import { prisma } from '../../lib/prisma';

export class GetSubscriptionStatusService {
  static async execute(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    });

    if (!subscription) {
      return {
        isPro: false,
        subscription: null,
      };
    }

    const isPro =
      subscription.status === 'ACTIVE' &&
      (!subscription.endAt || subscription.endAt > new Date());

    return {
      isPro,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startAt: subscription.startAt.toISOString(),
        endAt: subscription.endAt?.toISOString() ?? null,
      },
    };
  }
}
