import { prisma } from '../../lib/prisma'
import { randomUUID } from 'crypto'
import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client'

interface CreatePaymentParams {
  userId: string
  packageId: string
  method: PaymentMethod
}

export class CreatePaymentService {
  static async execute(params: CreatePaymentParams) {
    const pkg = await prisma.paymentPackage.findUnique({
      where: { id: params.packageId },
    })

    if (!pkg || !pkg.isActive) {
      throw new Error('Invalid or inactive package')
    }

    const paymentId = randomUUID()
    const externalReference = `f12_${paymentId}`

    const payment = await prisma.$transaction(async tx => {
      const created = await tx.payment.create({
        data: {
          id: paymentId,
          userId: params.userId,
          provider: PaymentProvider.MERCADO_PAGO,
          method: params.method,
          status: PaymentStatus.PENDING,
          packageId: pkg.id,
          amountCents: pkg.amountCents,
          coinsAmount: pkg.coinsAmount,
          bonusCoins: pkg.bonusCoins,
          externalReference,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'PAYMENT_CREATED',
          entity: 'PAYMENT',
          entityId: created.id,
          metadata: {
            provider: created.provider,
            method: created.method,
            status: created.status,
            packageId: created.packageId,
            amountCents: created.amountCents,
            coinsAmount: created.coinsAmount,
            bonusCoins: created.bonusCoins,
            externalReference: created.externalReference,
          },
        },
      })

      return created
    })

    return {
      paymentId: payment.id,
      externalPaymentId: payment.externalPaymentId,
      status: payment.status,
      checkoutUrl: null,
    }
  }
}
