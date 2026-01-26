import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';

export class ProcessMpSubscriptionCreatedService {
  static async execute(event: any): Promise<void> {
    const timestamp = new Date().toISOString();
    const externalEventId = event?.id;
    const subscriptionId = event?.data?.id;

    if (!externalEventId || !subscriptionId) {
      console.warn({
        level: 'WARN',
        service: 'ProcessMpSubscriptionCreatedService',
        action: 'validation.failed',
        message: 'Evento inválido',
        timestamp,
      });
      return;
    }

    const alreadyProcessed = await prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: 'MERCADO_PAGO',
          externalEventId,
        },
      },
    });

    if (alreadyProcessed) {
      console.info({
        level: 'INFO',
        service: 'ProcessMpSubscriptionCreatedService',
        action: 'idempotency.hit',
        externalEventId,
        message: 'Evento já processado',
        timestamp,
      });
      return;
    }

    if (!process.env.MP_ACCESS_TOKEN) return;

    const mpClient = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN);
    const mpSubscription = await mpClient.getSubscription(subscriptionId);

    await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'MERCADO_PAGO',
        externalEventId,
        payload: mpSubscription,
      },
    });

    const userId = mpSubscription.external_reference;
    if (!userId) return;

    const plan =
      mpSubscription.reason === 'Plano Anual' ? 'ANNUAL' : 'MONTHLY';

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan,
        status: 'ACTIVE',
        provider: 'MERCADO_PAGO',
        externalSubscriptionId: mpSubscription.id,
        externalCustomerId: mpSubscription.payer_id,
        startAt: new Date(mpSubscription.start_date),
        endAt: mpSubscription.end_date
          ? new Date(mpSubscription.end_date)
          : null,
      },
      create: {
        userId,
        plan,
        status: 'ACTIVE',
        provider: 'MERCADO_PAGO',
        externalSubscriptionId: mpSubscription.id,
        externalCustomerId: mpSubscription.payer_id,
        startAt: new Date(mpSubscription.start_date),
        endAt: mpSubscription.end_date
          ? new Date(mpSubscription.end_date)
          : null,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: 'PRO' },
    });

    console.info({
      level: 'INFO',
      service: 'ProcessMpSubscriptionCreatedService',
      action: 'subscription.activated',
      subscriptionId: mpSubscription.id,
      userId,
      message: 'Assinatura ativada com sucesso',
      timestamp,
    });
  }
}
