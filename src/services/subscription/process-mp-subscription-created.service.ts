import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';

/**
 * Processa o evento subscription.created do Mercado Pago
 *
 * REGRAS ABSOLUTAS:
 * - Webhook é a única fonte da verdade
 * - Idempotente por externalEventId
 * - Não cria pagamentos
 * - Não credita wallet
 * - Apenas cria/atualiza assinatura
 * - Garante papel PRO
 */
export class ProcessMpSubscriptionCreatedService {
  static async execute(event: any): Promise<void> {
    /**
     * 1️⃣ Validação mínima do evento
     */
    const externalEventId: string | undefined = event?.id;
    const subscriptionId: string | undefined = event?.data?.id;

    if (!externalEventId || !subscriptionId) {
      return;
    }

    /**
     * 2️⃣ Idempotência — evento já processado?
     */
    const alreadyProcessed = await prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: 'MERCADO_PAGO',
          externalEventId,
        },
      },
    });

    if (alreadyProcessed) {
      return;
    }

    /**
     * 3️⃣ Buscar assinatura real no Mercado Pago
     */
    if (!process.env.MP_ACCESS_TOKEN) {
      return;
    }

    const mpClient = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN);
    const mpSubscription = await mpClient.getSubscription(subscriptionId);

    /**
     * 4️⃣ Registrar evento bruto (append-only)
     */
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'MERCADO_PAGO',
        externalEventId,
        payload: mpSubscription,
      },
    });

    /**
     * 5️⃣ Identificar usuário
     *
     * REGRA FIXA:
     * external_reference = userId (Fantasy12)
     */
    const userId: string | undefined = mpSubscription.external_reference;
    if (!userId) {
      return;
    }

    /**
     * 6️⃣ Determinar plano
     * (Regra simples, desacoplada de MP)
     */
    const plan =
      mpSubscription.reason === 'Plano Anual'
        ? 'ANNUAL'
        : 'MONTHLY';

    /**
     * 7️⃣ Criar ou atualizar assinatura local
     */
    await prisma.subscription.upsert({
      where: {
        userId,
      },
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

    /**
     * 8️⃣ Garantir papel PRO
     * (idempotente)
     */
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: 'PRO',
      },
    });
  }
}
