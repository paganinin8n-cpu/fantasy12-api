import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';
import {
  PaymentProvider,
  PaymentStatus,
  WalletTransactionType,
  Prisma,
  SubscriptionPlan,
} from '@prisma/client';
import { RenewSubscriptionFromPaymentService } from '../subscription/renew-subscription-from-payment.service';

/**
 * Processa eventos de webhook do Mercado Pago.
 *
 * Regras:
 * - Webhook é a única fonte de verdade
 * - Idempotência obrigatória
 * - Crédito financeiro ocorre uma única vez
 * - Renovação de assinatura ocorre somente após crédito confirmado
 */
export class ProcessMercadoPagoWebhookService {
  static async execute(event: any): Promise<void> {
    /**
     * 1️⃣ Validação mínima do evento
     */
    const externalEventId = event?.id;
    const mpPaymentId = event?.data?.id;

    if (!externalEventId || !mpPaymentId) {
      return;
    }

    /**
     * 2️⃣ Idempotência
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
     * 3️⃣ Buscar pagamento no Mercado Pago
     */
    if (!process.env.MP_ACCESS_TOKEN) {
      return;
    }

    const mpClient = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN);
    const mpPayment = await mpClient.getPayment(mpPaymentId);

    /**
     * 4️⃣ Registrar evento (append-only)
     */
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.MERCADO_PAGO,
        externalEventId,
        payload: mpPayment,
      },
    });

    /**
     * 5️⃣ Localizar Payment interno
     */
    const payment = await prisma.payment.findFirst({
      where: {
        externalReference: mpPayment.external_reference ?? undefined,
      },
    });

    if (!payment || payment.isCredited) {
      return;
    }

    /**
     * 6️⃣ Pagamento não aprovado → apenas refletir status
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
     * 7️⃣ Pagamento aprovado → transação atômica
     */
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Ledger (append-only)
      await tx.walletLedger.create({
        data: {
          wallet: { connect: { userId: payment.userId } },
          type: WalletTransactionType.CREDIT,
          amount: payment.coinsAmount,
          description: 'Pagamento aprovado via Mercado Pago',
        },
      });

      // Wallet
      await tx.wallet.update({
        where: { userId: payment.userId },
        data: {
          balance: { increment: payment.coinsAmount },
        },
      });

      // Payment
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
     * 8️⃣ Renovação automática da assinatura (v1.5)
     */
    const plan = mpPayment.metadata?.plan as SubscriptionPlan | undefined;

    if (plan === SubscriptionPlan.MONTHLY || plan === SubscriptionPlan.ANNUAL) {
      await RenewSubscriptionFromPaymentService.execute({
        userId: payment.userId,
        plan,
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
