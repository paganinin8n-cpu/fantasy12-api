import { randomUUID } from 'crypto'
import {
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
  Prisma,
} from '@prisma/client'
import { MercadoPagoClient } from '../../lib/mercado-pago.client'
import { prisma } from '../../lib/prisma'
import { RenewSubscriptionFromPaymentService } from '../subscription/renew-subscription-from-payment.service'
import { WalletService } from '../wallet/wallet.service'
import {
  normalizeMercadoPagoPaymentEvent,
  validateMercadoPagoPayment,
} from './mercado-pago-payment.helpers'

export class ProcessMercadoPagoWebhookService {
  static async execute(event: unknown): Promise<void> {
    const normalizedEvent = normalizeMercadoPagoPaymentEvent(
      event as { id?: string | number; data?: { id?: string | number } }
    )
    if (!normalizedEvent) return

    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('MP_ACCESS_TOKEN nao configurado')
    }

    const mpClient = new MercadoPagoClient(accessToken)
    const mpPayment = await mpClient.getPayment(
      normalizedEvent.externalPaymentId
    )

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      try {
        await tx.paymentWebhookEvent.create({
          data: {
            id: randomUUID(),
            provider: PaymentProvider.MERCADO_PAGO,
            externalEventId: normalizedEvent.externalEventId,
            payload: mpPayment,
          },
        })
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return
        }
        throw error
      }

      const externalReference =
        typeof mpPayment.external_reference === 'string'
          ? mpPayment.external_reference
          : null
      const payment = externalReference
        ? await tx.payment.findUnique({
            where: { externalReference },
          })
        : null

      if (!payment) {
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_WEBHOOK_UNMATCHED',
            entity: 'PAYMENT_WEBHOOK_EVENT',
            entityId: normalizedEvent.externalEventId,
            metadata: {
              externalPaymentId: normalizedEvent.externalPaymentId,
              externalReference,
              status: mpPayment.status ?? null,
            },
          },
        })
        return
      }

      if (payment.processedAt) {
        await tx.auditLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_WEBHOOK_ALREADY_PROCESSED',
            entity: 'PAYMENT',
            entityId: payment.id,
            metadata: {
              externalEventId: normalizedEvent.externalEventId,
              externalPaymentId: normalizedEvent.externalPaymentId,
              status: payment.status,
            },
          },
        })
        return
      }

      if (mpPayment.status !== 'approved') {
        const status = this.mapMpStatus(String(mpPayment.status ?? ''))
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status,
            externalPaymentId: normalizedEvent.externalPaymentId,
          },
        })
        await tx.auditLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_STATUS_UPDATED_FROM_WEBHOOK',
            entity: 'PAYMENT',
            entityId: payment.id,
            metadata: {
              externalEventId: normalizedEvent.externalEventId,
              externalPaymentId: normalizedEvent.externalPaymentId,
              previousStatus: payment.status,
              status,
              mpStatus: mpPayment.status ?? null,
            },
          },
        })
        return
      }

      const validation = validateMercadoPagoPayment(payment, mpPayment)
      if (!validation.valid) {
        await tx.auditLog.create({
          data: {
            userId: payment.userId,
            action: 'PAYMENT_WEBHOOK_VALIDATION_FAILED',
            entity: 'PAYMENT',
            entityId: payment.id,
            metadata: {
              reason: validation.reason,
              externalEventId: normalizedEvent.externalEventId,
              externalPaymentId: normalizedEvent.externalPaymentId,
              expectedAmountCents: payment.amountCents,
              receivedAmount: mpPayment.transaction_amount ?? null,
              receivedCurrency: mpPayment.currency_id ?? null,
            },
          },
        })
        return
      }

      if (payment.purpose === PaymentPurpose.WALLET_CREDIT) {
        await WalletService.credit(
          payment.userId,
          payment.coinsAmount + payment.bonusCoins,
          `Pagamento Mercado Pago ${normalizedEvent.externalPaymentId}`,
          tx
        )
      } else {
        if (!payment.subscriptionPlan) {
          throw new Error(`Pagamento ${payment.id} sem plano de assinatura`)
        }
        await RenewSubscriptionFromPaymentService.execute(
          { userId: payment.userId, plan: payment.subscriptionPlan },
          tx
        )
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.APPROVED,
          isCredited: payment.purpose === PaymentPurpose.WALLET_CREDIT,
          processedAt: new Date(),
          externalPaymentId: normalizedEvent.externalPaymentId,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: payment.userId,
          action:
            payment.purpose === PaymentPurpose.WALLET_CREDIT
              ? 'PAYMENT_APPROVED_AND_CREDITED'
              : 'SUBSCRIPTION_PAYMENT_APPROVED',
          entity: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            externalEventId: normalizedEvent.externalEventId,
            externalPaymentId: normalizedEvent.externalPaymentId,
            previousStatus: payment.status,
            status: PaymentStatus.APPROVED,
            purpose: payment.purpose,
            amountCents: payment.amountCents,
          },
        },
      })
    })
  }

  private static mapMpStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':
        return PaymentStatus.APPROVED
      case 'rejected':
        return PaymentStatus.REJECTED
      case 'cancelled':
        return PaymentStatus.CANCELLED
      case 'refunded':
        return PaymentStatus.REFUNDED
      default:
        return PaymentStatus.PENDING
    }
  }
}
