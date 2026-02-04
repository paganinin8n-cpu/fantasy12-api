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

    const payment = await prisma.payment.create({
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

    return {
      paymentId: payment.id,
      externalPaymentId: payment.externalPaymentId,
      status: payment.status,
      checkoutUrl: null,
    }
  }
}
