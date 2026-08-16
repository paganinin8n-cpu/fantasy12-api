import { prisma } from '../../lib/prisma';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

type Input = {
  userId: string;
  plan: SubscriptionPlan;
  packageId: string;
  validityMonths: 1 | 12;
};

/** Soma meses de calendário sem deixar datas como 31/jan saltarem março. */
export function addSubscriptionValidityMonths(date: Date, months: number) {
  const result = new Date(date)
  const originalDay = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(
    result.getUTCFullYear(),
    result.getUTCMonth() + 1,
    0,
  )).getUTCDate()
  result.setUTCDate(Math.min(originalDay, lastDay))
  return result
}

export class RenewSubscriptionFromPaymentService {
  static async execute(
    { userId, plan, packageId, validityMonths }: Input,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const db = tx ?? prisma;
    const subscription = await db.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();

    const extendsActivePeriod = !!subscription?.endAt && subscription.endAt > now
    const validityBase = extendsActivePeriod ? subscription!.endAt! : now
    const newEndAt = addSubscriptionValidityMonths(validityBase, validityMonths)

    if (!subscription) {
      await db.subscription.create({
        data: {
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          startAt: now,
          endAt: newEndAt,
          provider: 'MERCADO_PAGO',
          subscriptionPackageId: packageId,
        },
      });
      return;
    }

    await db.subscription.update({
      where: { userId },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        ...(!extendsActivePeriod ? { startAt: now } : {}),
        endAt: newEndAt,
        provider: 'MERCADO_PAGO',
        subscriptionPackageId: packageId,
      },
    });
  }
}
