import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';

/**
 * Processa o evento subscription.updated do Mercado Pago
 *
 * REGRAS ABSOLUTAS:
 * - Webhook é a única fonte da verdade
 * - Idempotente por externalEventId
 * - Não cria pagamentos
 * - Não credita wallet
 * - Apenas sincroniza estado da assinatura
 * - Papel PRO depende do status
 */
export class ProcessMpSubscriptionUpdatedService {
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
     * 6️⃣ Mapear status da assinatura
     */
    const statusMap: Record<string, 'ACTIVE' | 'CANCELLED' | 'EXPIRED'> = {
      authorized: 'ACTIVE',
      paused: 'ACTIVE',
      cancelled: 'CANCELLED',
      expired: 'EXPIRED',
    };

    const mappedStatus =
      statusMap[mpSubscription.status] ?? 'EXPIRED';

    /**
     * 7️⃣ Atualizar assinatura local
     */
    await prisma.subscription.update({
      where: {
        userId,
      },
      data: {
        status: mappedStatus,
        startAt: new Date(mpSubscription.start_date),
        endAt: mpSubscription.end_date
          ? new Date(mpSubscription.end_date)
          : null,
      },
    });

    /**
     * 8️⃣ Atualizar papel do usuário conforme status
     */
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: mappedStatus === 'ACTIVE' ? 'PRO' : 'NORMAL',
      },
    });
  }
}
