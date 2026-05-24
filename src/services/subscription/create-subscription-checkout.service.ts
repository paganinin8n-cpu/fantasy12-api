import { randomUUID } from 'crypto'
import { prisma } from '../../lib/prisma'
import { MercadoPagoClient } from '../../lib/mercado-pago.client'
import { AppError } from '../../errors/AppError'
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

function getNotificationUrl() {
  const explicit = process.env.MP_NOTIFICATION_URL?.trim()
  if (explicit) return explicit

  const apiUrl = process.env.API_PUBLIC_URL?.trim()?.replace(/\/+$/, '')
  if (!apiUrl) return undefined

  return `${apiUrl}/internal/webhooks/mercado-pago`
}

function getPaymentMethods(plan: SubscriptionPlanOffer): PreferencePayload['payment_methods'] {
  if (plan.id === 'pro_annual_card') {
    return {
      installments: 12,
      default_installments: 12,
      excluded_payment_types: [{ id: 'ticket' }],
    }
  }

  if (plan.id === 'pro_annual_pix') {
    return {
      installments: 1,
      excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
    }
  }

  return {
    installments: 1,
    default_installments: 1,
    excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
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
    const notificationUrl = getNotificationUrl()

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
      external_reference: `f12_sub_${checkoutId}`,
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

    const mp = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN)
    const preference = await mp.createPreference(payload)

    return {
      checkoutId,
      planId: plan.id,
      provider: 'MERCADO_PAGO',
      checkoutUrl: preference.init_point ?? preference.sandbox_init_point ?? null,
      preferenceId: preference.id ?? null,
      status: 'PENDING',
    }
  }
}
