import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';

export class DetectSubscriptionAlertsService {
  static async execute(): Promise<void> {
    const timestamp = new Date().toISOString();

    const subscriptions = await prisma.subscription.findMany();

    for (const sub of subscriptions) {
      const isMarkedActive = sub.status === 'ACTIVE';
      const isEffectivelyActive = hasActiveProSubscription(sub);

      if (isMarkedActive === isEffectivelyActive) {
        continue;
      }

      console.error({
        level: 'CRITICAL',
        service: 'DetectSubscriptionAlertsService',
        action: 'subscription.state_mismatch',
        subscriptionId: sub.id,
        userId: sub.userId,
        message: `Inconsistência assinatura (${sub.status}) x vigência (${sub.endAt?.toISOString() ?? 'sem fim'})`,
        timestamp,
      });
    }
  }
}
