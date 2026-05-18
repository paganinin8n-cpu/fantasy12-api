import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription, hasAnnualProSubscription } from '../../domain/subscription';

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
        isAnnualPro: false,
        subscription: null,
      };
    }

    const isPro = hasActiveProSubscription(subscription);
    const isAnnualPro = hasAnnualProSubscription(subscription);

    return {
      isPro,
      isAnnualPro,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startAt: subscription.startAt.toISOString(),
        endAt: subscription.endAt?.toISOString() ?? null,
      },
    };
  }
}
