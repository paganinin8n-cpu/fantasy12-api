import { prisma } from '../../lib/prisma';
import { hasActiveProSubscription } from '../../domain/subscription';
import { AlertDispatcherService } from './alert-dispatcher.service';

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

      await AlertDispatcherService.dispatch({
        level: 'CRITICAL',
        service: 'DetectSubscriptionAlertsService',
        action: 'subscription.state_mismatch',
        message: `Inconsistência assinatura (${sub.status}) x vigência (${sub.endAt?.toISOString() ?? 'sem fim'})`,
        timestamp,
        data: {
          subscriptionId: sub.id,
          userId: sub.userId,
          status: sub.status,
          endAt: sub.endAt?.toISOString() ?? null,
        },
      });
    }
  }
}
