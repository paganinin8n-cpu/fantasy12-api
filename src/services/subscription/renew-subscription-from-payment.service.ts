import { prisma } from '../../lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

type Input = {
  userId: string;
  plan: SubscriptionPlan;
};

export class RenewSubscriptionFromPaymentService {
  static async execute({ userId, plan }: Input): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();

    const periodDays =
      plan === SubscriptionPlan.MONTHLY ? 30 : 365;

    const newEndAt = subscription?.endAt && subscription.endAt > now
      ? new Date(subscription.endAt.getTime() + periodDays * 86400000)
      : new Date(now.getTime() + periodDays * 86400000);

    if (!subscription) {
      await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          startAt: now,
          endAt: newEndAt,
        },
      });
      return;
    }

    await prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        endAt: newEndAt,
      },
    });
  }
}
