import { prisma } from '../../lib/prisma';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

type Input = {
  userId: string;
  plan: SubscriptionPlan;
};

export class RenewSubscriptionFromPaymentService {
  static async execute(
    { userId, plan }: Input,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const db = tx ?? prisma;
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();

    const periodDays =
      plan === SubscriptionPlan.MONTHLY ? 30 : 365;

    const newEndAt = subscription?.endAt && subscription.endAt > now
      ? new Date(subscription.endAt.getTime() + periodDays * 86400000)
      : new Date(now.getTime() + periodDays * 86400000);

    if (!subscription) {
      await db.subscription.create({
        data: {
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          startAt: now,
          endAt: newEndAt,
          provider: 'MERCADO_PAGO',
        },
      });
      return;
    }

    await db.subscription.update({
      where: { userId },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        endAt: newEndAt,
        provider: 'MERCADO_PAGO',
      },
    });
  }
}
