import { prisma } from '../../lib/prisma';
import { MercadoPagoClient } from '../../lib/mercado-pago.client';
import { ActivateProFromPaymentService } from '../subscription/activate-pro-from-payment.service';
import {
  PaymentProvider,
  PaymentStatus,
  WalletTransactionType,
  Prisma,
} from '@prisma/client';

/**
 * Processa eventos de webhook do Mercado Pago.
 */
export class ProcessMercadoPagoWebhookService {
  static async execute(event: any): Promise<void> {
    const externalEventId = event?.id;
    const mpPaymentId = event?.data?.id;

    if (!externalEventId || !mpPaymentId) return;

    const alreadyProcessed =
      await prisma.paymentWebhookEvent.findUnique({
        where: {
          provider_externalEventId: {
            provider: PaymentProvider.MERCADO_PAGO,
            externalEventId,
          },
        },
      });

    if (alreadyProcessed) return;

    if (!process.env.MP_ACCESS_TOKEN) return;

    const mpClient = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN);
    const mpPayment = await mpClient.getPayment(mpPaymentId);

    await prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.MERCADO_PAGO,
        externalEventId,
        payload: mpPayment,
      },
    });

    const payment = await prisma.payment.findFirst({
      where: {
        externalReference: mpPayment.external_reference ?? undefined,
      },
    });

    if (!payment || payment.isCredited) return;

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

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.walletLedger.create({
        data: {
          wallet: { connect: { userId: payment.userId } },
          type: WalletTransactionType.CREDIT,
          amount: payment.coinsAmount,
          description: 'Pagamento aprovado via Mercado Pago',
        },
      });

      await tx.wallet.update({
        where: { userId: payment.userId },
        data: {
          balance: { increment: payment.coinsAmount },
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          isCredited: true,
          externalPaymentId: mpPayment.id?.toString(),
        },
      });
    });

    const priceId = mpPayment.metadata?.priceId;
    if (priceId) {
      await ActivateProFromPaymentService.execute({
        userId: payment.userId,
        priceId,
        paymentId: payment.id,
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
