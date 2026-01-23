import { prisma } from '../../lib/prisma';

export class GetAdminSubscriptionService {
  static async execute(subscriptionId: string) {
    /**
     * 1️⃣ Buscar assinatura
     */
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    /**
     * 2️⃣ Buscar eventos de webhook (somente se houver externalSubscriptionId)
     */
    const webhookEvents = subscription.externalSubscriptionId
      ? await prisma.paymentWebhookEvent.findMany({
          where: {
            provider: 'MERCADO_PAGO',
            payload: {
              path: ['id'],
              equals: subscription.externalSubscriptionId,
            },
          },
          orderBy: {
            receivedAt: 'desc',
          },
          take: 10,
        })
      : [];

    /**
     * 3️⃣ Retorno estruturado
     */
    return {
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        provider: subscription.provider,
        externalSubscriptionId: subscription.externalSubscriptionId,
        externalCustomerId: subscription.externalCustomerId,
        startAt: subscription.startAt,
        endAt: subscription.endAt,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
      user: subscription.user,
      webhookEvents: webhookEvents.map((event) => ({
        id: event.id,
        externalEventId: event.externalEventId,
        receivedAt: event.receivedAt,
        payload: event.payload,
      })),
    };
  }
}
