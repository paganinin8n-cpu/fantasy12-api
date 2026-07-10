import { randomUUID } from 'crypto'
import {
  PaymentMethod,
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
} from '@prisma/client'
import { AppError } from '../../errors/AppError'
import { MercadoPagoClient } from '../../lib/mercado-pago.client'
import { prisma } from '../../lib/prisma'
import {
  getMercadoPagoCheckoutUrl,
  getMercadoPagoNotificationUrl,
  getMercadoPagoPaymentMethods,
} from './mercado-pago-payment.helpers'

interface CreatePaymentParams {
  userId: string
  packageId: string
  method: PaymentMethod
}

function getFrontendUrl() {
  return (
    process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim()?.replace(/\/+$/, '') ||
    'https://www.fantasy12.com'
  )
}

export class CreatePaymentService {
  static async execute(params: CreatePaymentParams) {
    const accessToken = process.env.MP_ACCESS_TOKEN
    if (!accessToken) {
      throw AppError.internal(
        'Checkout indisponível no momento',
        'mp_access_token_missing'
      )
    }

    const [pkg, user] = await Promise.all([
      prisma.paymentPackage.findUnique({ where: { id: params.packageId } }),
      prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true, name: true, email: true },
      }),
    ])

    if (!pkg || !pkg.isActive) {
      throw AppError.badRequest(
        'Pacote inválido ou indisponível',
        'invalid_payment_package'
      )
    }
    if (!user) throw AppError.notFound('Usuário', 'user_not_found')

    const paymentId = randomUUID()
    const externalReference = `f12_${paymentId}`
    const frontendUrl = getFrontendUrl()

    const payment = await prisma.$transaction(async tx => {
      const created = await tx.payment.create({
        data: {
          id: paymentId,
          userId: params.userId,
          provider: PaymentProvider.MERCADO_PAGO,
          method: params.method,
          purpose: PaymentPurpose.WALLET_CREDIT,
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
            purpose: created.purpose,
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

    const preferencePayload = {
      items: [
        {
          id: pkg.id,
          title: pkg.label,
          description: `${pkg.coinsAmount + pkg.bonusCoins} fichas Fantasy12`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: pkg.amountCents / 100,
        },
      ],
      payer: { email: user.email, name: user.name },
      external_reference: externalReference,
      metadata: {
        checkout_type: 'wallet_credit',
        payment_id: payment.id,
        user_id: user.id,
        package_id: pkg.id,
      },
      back_urls: {
        success: `${frontendUrl}/bar?checkout=success`,
        failure: `${frontendUrl}/bar?checkout=failure`,
        pending: `${frontendUrl}/bar?checkout=pending`,
      },
      auto_return: 'approved',
      payment_methods: getMercadoPagoPaymentMethods(params.method),
      ...(getMercadoPagoNotificationUrl()
        ? { notification_url: getMercadoPagoNotificationUrl() }
        : {}),
    }

    const mp = new MercadoPagoClient(accessToken)
    const preference = await mp.createPreference(preferencePayload, payment.id)
    const checkoutUrl = getMercadoPagoCheckoutUrl(preference, accessToken)

    if (!preference.id || !checkoutUrl) {
      throw AppError.internal(
        'Mercado Pago não retornou uma URL de checkout',
        'mp_checkout_url_missing'
      )
    }

    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          externalPreferenceId: String(preference.id),
          checkoutUrl,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'PAYMENT_CHECKOUT_CREATED',
          entity: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            externalPreferenceId: String(preference.id),
          },
        },
      })
    })

    return {
      paymentId: payment.id,
      externalPaymentId: payment.externalPaymentId,
      preferenceId: String(preference.id),
      status: payment.status,
      checkoutUrl,
    }
  }
}
