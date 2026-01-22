import { prisma } from '@/lib/prisma';
import { MercadoPagoClient } from '@/lib/mercado-pago.client';
import { ActivateProFromPaymentService } from '@/services/subscription/activate-pro-from-payment.service';
import {
  PaymentProvider,
  PaymentStatus,
  WalletTransactionType,
} from '@prisma/client';

/**
 * Processa eventos de webhook do Mercado Pago.
 *
 * REGRAS ABSOLUTAS:
 * - Webhook é a única fonte de verdade
 * - Processamento idempotente
 * - Crédito financeiro ocorre uma única vez
 * - Ativação PRO ocorre somente após crédito confirmado
 * - Nenhuma lógica financeira fora deste fluxo
 */
export class ProcessMercadoPagoWebhookService {
  static async execute(event: any): Promise<void> {
    /**
     * 1️⃣ Validação mínima do evento
     */
    const externalEventId: string | undefined = event?.id;
    const mpPaymentId: string | undefined = event?.data?.id;

    if (!externalEventId || !mpPaymentId) {
      // Evento inválido — ignorar silenciosamente
      return;
    }

    /**
     * 2️⃣ Idempotência — evento já processado?
     */
    const alreadyProcessed =
      await prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_externalEventId: {
            provider: PaymentProvider.MERCADO_PAGO,
            externalEventId,
          },
        },
      });

    if (alreadyProcessed) {
      return;
    }

    /**
     * 3️⃣ Buscar pagamento real no Mercado Pago
     */
    const mpClient = new MercadoPagoClient(
      process.env.MP_ACCESS_TOKEN as string
    );

    const mpPayment = await mpClient.getPayment(mpPaymentId);

    /**
     * 4️⃣ Registrar evento de webhook (append-only)
     */
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.MERCADO_PAGO,
        externalEventId,
        payload: mpPayment,
      },
    });

    /**
     * 5️⃣ Localizar Payment interno via externalReference
     */
    const payment = await prisma.payment.findFirst({
      where: {
        externalReference: mpPayment.external_reference ?? undefined,
      },
    });

    if (!payment) {
      // Pagamento não pertence ao Fantasy12
      return;
    }

    /**
     * 6️⃣ Se já creditado, não faz nada (proteção dupla)
     */
    if (payment.isCredited) {
      return;
    }

    /**
     * 7️⃣ Status não aprovado → apenas refletir status
     */
    if (mpPayment.status !== 'approved') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: this.mapMpStatus(mpPayment.status),
          externalPaymentId: mpPayment.id?.toString(),
        },
      });
      return;
    }

    /**
     * 8️⃣ Pagamento APROVADO → transação atômica
     */
    await prisma.$transaction(async (tx) => {
      /**
       * 8.1 Crédito no ledger (append-only)
       */
      await tx.walletLedger.create({
        data: {
          wallet: {
            connect: { userId: payment.userId },
          },
          type: WalletTransactionType.CREDIT,
          amount: payment.coinsAmount,
          description: 'Pagamento aprovado via Mercado Pago',
        },
      });

      /**
       * 8.2 Incremento de saldo
       */
      await tx.wallet.update({
        where: { userId: payment.userId },
        data: {
          balance: {
            increment: payment.coinsAmount,
          },
        },
      });

      /**
       * 8.3 Atualizar Payment
       */
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          isCredited: true,
          externalPaymentId: mpPayment.id?.toString(),
        },
      });
    });

    /**
     * 9️⃣ Ativação / Renovação PRO (v1.4)
     * Executada SOMENTE após crédito confirmado
     */
    const priceId = mpPayment.metadata?.priceId;
    if (priceId) {
      await ActivateProFromPaymentService.execute({
        userId: payment.userId,
        priceId,
        paymentId: payment.id,
      });
    }
  }

  /**
   * Mapeia status do Mercado Pago → PaymentStatus interno
   */
  private static mapMpStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'rejected':
        return PaymentStatus.REJECTED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
}
