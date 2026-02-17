import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';
import {
  PaymentProvider,
  PaymentStatus,
  SubscriptionPlan,
  Prisma,
} from '@prisma/client';
import { RenewSubscriptionFromPaymentService } from '../subscription/renew-subscription-from-payment.service';
import { WalletService } from '../wallet/wallet.service';
import { randomUUID } from 'crypto';

export class ProcessMercadoPagoWebhookService {
  static async execute(event: any): Promise<void> {
    const externalEventId = event?.id;
    const mpPaymentId = event?.data?.id;

    if (!externalEventId || !mpPaymentId) {
      return;
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      return;
    }

    const mpClient = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN);
    const mpPayment = await mpClient.getPayment(mpPaymentId);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      /**
       * 1️⃣ Idempotência (com lock transacional)
       */
      const alreadyProcessed =
        await tx.paymentWebhookEvent.findUnique({
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
       * 2️⃣ Registrar evento (append-only)
       */
      await tx.paymentWebhookEvent.create({
        data: {
          id: randomUUID(),
          provider: PaymentProvider.MERCADO_PAGO,
          externalEventId,
          payload: mpPayment,
        },
      });

      /**
       * 3️⃣ Localizar Payment interno
       */
      const payment = await tx.payment.findFirst({
        where: {
          externalReference: mpPayment.external_reference ?? undefined,
        },
      });

      if (!payment || payment.isCredited) {
        return;
      }

      /**
       * 4️⃣ Atualizar status se não aprovado
       */
      if (mpPayment.status !== 'approved') {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: this.mapMpStatus(mpPayment.status),
            externalPaymentId: mpPayment.id?.toString(),
          },
        });
        return;
      }

      /**
       * 5️⃣ Crédito financeiro via WalletService
       */
      const totalCredit = payment.coinsAmount + payment.bonusCoins;

      await WalletService.credit(
        payment.userId,
        totalCredit,
        'Pagamento aprovado via Mercado Pago',
        tx
      );

      /**
       * 6️⃣ Atualizar Payment
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
     * 7️⃣ Renovação fora da transação principal
     */
    const plan = mpPayment.metadata?.plan as SubscriptionPlan | undefined;

    if (
      plan === SubscriptionPlan.MONTHLY ||
      plan === SubscriptionPlan.ANNUAL
    ) {
      await RenewSubscriptionFromPaymentService.execute({
        userId: mpPayment.metadata?.userId,
        plan,
      });
    }
  }

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
