import { prisma } from '../../lib/prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

const PRICE_PLAN_MAP: Record<string, SubscriptionPlan> = {
  PRO_MONTHLY: SubscriptionPlan.MONTHLY,
  PRO_ANNUAL: SubscriptionPlan.ANNUAL,
};

const PLAN_DURATION_DAYS: Record<SubscriptionPlan, number> = {
  MONTHLY: 30,
  ANNUAL: 365,
};

export class ActivateProFromPaymentService {
  static async execute(params: {
    userId: string;
    priceId: string;
    paymentId: string;
  }) {
    const plan = PRICE_PLAN_MAP[params.priceId];
    if (!plan) return; // pagamento não é de PRO

    const now = new Date();
    const durationDays = PLAN_DURATION_DAYS[plan];

    const existing = await prisma.subscription.findUnique({
      where: { userId: params.userId },
    });

    if (!existing) {
      await prisma.subscription.create({
        data: {
          userId: params.userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          startAt: now,
          endAt: new Date(now.getTime() + durationDays * 86400000),
        },
      });
      return;
    }

    const baseDate =
      existing.status === SubscriptionStatus.ACTIVE && existing.endAt
        ? existing.endAt
        : now;

    await prisma.subscription.update({
      where: { userId: params.userId },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        startAt: now,
        endAt: new Date(baseDate.getTime() + durationDays * 86400000),
      },
    });
  }
}
