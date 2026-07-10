import { randomUUID } from 'crypto'
import { prisma } from '../../lib/prisma'
import { MercadoPagoClient } from '../../lib/mercado-pago.client'
import { AppError } from '../../errors/AppError'
import {
  PaymentMethod,
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
} from '@prisma/client'
import {
  getMercadoPagoCheckoutUrl,
  getMercadoPagoNotificationUrl,
} from '../payment/mercado-pago-payment.helpers'
import {
  getSubscriptionPlanOffer,
  SubscriptionPlanOffer,
} from './subscription-plans.config'

type Input = {
  userId: string
  planId: string
}

type PreferencePayload = {
  items: Array<{
    id: string
    title: string
    description: string
    quantity: number
    currency_id: 'BRL'
    unit_price: number
  }>
  payer: {
    email: string
    name?: string
  }
  external_reference: string
  metadata: {
    checkout_type: 'subscription'
    user_id: string
    userId: string
    plan: 'MONTHLY' | 'ANNUAL'
    plan_id: string
    planId: string
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return: 'approved'
  notification_url?: string
  payment_methods?: {
    installments?: number
    default_installments?: number
    excluded_payment_types?: Array<{ id: string }>
  }
}

function getFrontendUrl() {
  return (
    process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim()?.replace(/\/+$/, '') ||
    'https://www.fantasy12.com'
  )
}

function getPaymentMethods(plan: SubscriptionPlanOffer): PreferencePayload['payment_methods'] {
  if (plan.id === 'pro_annual_card') {
    return {
      installments: 12,
      default_installments: 12,
      excluded_payment_types: [
        { id: 'bank_transfer' },
        { id: 'ticket' },
        { id: 'atm' },
      ],
    }
  }

  if (plan.id === 'pro_annual_pix') {
    return {
      installments: 1,
      excluded_payment_types: [
        { id: 'credit_card' },
        { id: 'debit_card' },
        { id: 'prepaid_card' },
        { id: 'ticket' },
        { id: 'atm' },
      ],
    }
  }

  return {
    installments: 1,
    default_installments: 1,
    excluded_payment_types: [
      { id: 'bank_transfer' },
      { id: 'ticket' },
      { id: 'atm' },
    ],
  }
}

export class CreateSubscriptionCheckoutService {
  static async execute({ userId, planId }: Input) {
    const plan = getSubscriptionPlanOffer(planId)
    if (!plan) {
      throw AppError.badRequest('Plano de assinatura inválido', 'invalid_subscription_plan')
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      throw AppError.internal(
        'Checkout de assinatura indisponível no momento',
        'mp_access_token_missing'
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found')
    }

    const checkoutId = randomUUID()
    const frontendUrl = getFrontendUrl()
    const notificationUrl = getMercadoPagoNotificationUrl()
    const externalReference = `f12_sub_${checkoutId}`
    const method = plan.paymentMethod === 'PIX' ? PaymentMethod.PIX : PaymentMethod.CARD

    await prisma.$transaction(async tx => {
      await tx.payment.create({
        data: {
          id: checkoutId,
          userId: user.id,
          provider: PaymentProvider.MERCADO_PAGO,
          method,
          purpose: PaymentPurpose.SUBSCRIPTION,
          status: PaymentStatus.PENDING,
          subscriptionPlan: plan.plan,
          amountCents: plan.totalCents,
          coinsAmount: 0,
          bonusCoins: 0,
          externalReference,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBSCRIPTION_PAYMENT_CREATED',
          entity: 'PAYMENT',
          entityId: checkoutId,
          metadata: {
            planId: plan.id,
            plan: plan.plan,
            method,
            amountCents: plan.totalCents,
            externalReference,
          },
        },
      })
    })

    const payload: PreferencePayload = {
      items: [
        {
          id: plan.id,
          title: plan.title,
          description: plan.subtitle,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: plan.totalCents / 100,
        },
      ],
      payer: {
        email: user.email,
        name: user.name,
      },
      external_reference: externalReference,
      metadata: {
        checkout_type: 'subscription',
        user_id: user.id,
        userId: user.id,
        plan: plan.plan,
        plan_id: plan.id,
        planId: plan.id,
      },
      back_urls: {
        success: `${frontendUrl}/subscription?checkout=success`,
        failure: `${frontendUrl}/subscription?checkout=failure`,
        pending: `${frontendUrl}/subscription?checkout=pending`,
      },
      auto_return: 'approved',
      payment_methods: getPaymentMethods(plan),
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    }

    const accessToken = process.env.MP_ACCESS_TOKEN
    const mp = new MercadoPagoClient(accessToken)
    const preference = await mp.createPreference(payload, checkoutId)
    const checkoutUrl = getMercadoPagoCheckoutUrl(preference, accessToken)

    if (!preference.id || !checkoutUrl) {
      throw AppError.internal(
        'Mercado Pago não retornou uma URL de checkout',
        'mp_checkout_url_missing'
      )
    }

    await prisma.$transaction(async tx => {
      await tx.payment.update({
        where: { id: checkoutId },
        data: {
          externalPreferenceId: String(preference.id),
          checkoutUrl,
        },
      })
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBSCRIPTION_CHECKOUT_CREATED',
          entity: 'PAYMENT',
          entityId: checkoutId,
          metadata: {
            externalPreferenceId: String(preference.id),
          },
        },
      })
    })

    return {
      checkoutId,
      planId: plan.id,
      provider: 'MERCADO_PAGO',
      checkoutUrl,
      preferenceId: String(preference.id),
      status: 'PENDING',
    }
  }
}
