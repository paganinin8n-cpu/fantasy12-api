import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';
import { randomUUID } from "crypto";

/**
 * Processa o evento subscription.cancelled do Mercado Pago
 *
 * REGRAS ABSOLUTAS:
 * - Webhook é a única fonte da verdade
 * - Idempotente por externalEventId
 * - Não cria pagamentos
 * - Não credita wallet
 * - Cancela assinatura local
 * - Remove papel PRO
 * - Histórico preservado
 */
export class ProcessMpSubscriptionCancelledService {
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
      id: randomUUID( ),
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
     * 6️⃣ Atualizar assinatura local para CANCELLED
     */
    await prisma.subscription.update({
      where: {
        userId,
      },
      data: {
        status: 'CANCELLED',
        endAt: mpSubscription.end_date
          ? new Date(mpSubscription.end_date)
          : new Date(),
      },
    });

    /**
     * 7️⃣ Rebaixar usuário para NORMAL
     */
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role: 'NORMAL',
      },
    });
  }
}
