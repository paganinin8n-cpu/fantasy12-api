export type SubscriptionPlanPaymentMethod = 'CARD' | 'PIX'

export type SubscriptionPlanOffer = {
  id: 'pro_monthly' | 'pro_annual_card' | 'pro_annual_pix'
  plan: 'MONTHLY' | 'ANNUAL'
  paymentMethod: SubscriptionPlanPaymentMethod
  title: string
  subtitle: string
  amountCents: number
  installments: number
  installmentCents: number | null
  totalCents: number
  badge: string | null
  benefits: string[]
  checkoutEnabled: boolean
}

export const SUBSCRIPTION_PLAN_OFFERS: SubscriptionPlanOffer[] = [
  {
    id: 'pro_monthly',
    plan: 'MONTHLY',
    paymentMethod: 'CARD',
    title: 'PRO Mensal',
    subtitle: 'R$ 24,90 por mês',
    amountCents: 2490,
    installments: 1,
    installmentCents: null,
    totalCents: 2490,
    badge: null,
    benefits: [
      '4 Duplas gratuitas por rodada',
      '2 Super Duplas gratuitas por rodada',
      'Ranking PRO exclusivo',
    ],
    checkoutEnabled: true,
  },
  {
    id: 'pro_annual_card',
    plan: 'ANNUAL',
    paymentMethod: 'CARD',
    title: 'PRO Anual no cartão',
    subtitle: '12x R$ 9,90',
    amountCents: 11880,
    installments: 12,
    installmentCents: 990,
    totalCents: 11880,
    badge: 'Libera bolões',
    benefits: [
      '4 Duplas gratuitas por rodada',
      '2 Super Duplas gratuitas por rodada',
      'Criação de bolões exclusivos',
    ],
    checkoutEnabled: true,
  },
  {
    id: 'pro_annual_pix',
    plan: 'ANNUAL',
    paymentMethod: 'PIX',
    title: 'PRO Anual no PIX',
    subtitle: 'R$ 99,00 anual',
    amountCents: 9900,
    installments: 1,
    installmentCents: null,
    totalCents: 9900,
    badge: 'Pague 10, ganhe 12',
    benefits: [
      'Economia sobre o plano mensal',
      '4 Duplas e 2 Super Duplas por rodada',
      'Criação de bolões exclusivos',
    ],
    checkoutEnabled: true,
  },
]

export class ListSubscriptionPlansService {
  static execute() {
    const checkoutEnabled = Boolean(process.env.MP_ACCESS_TOKEN)

    return SUBSCRIPTION_PLAN_OFFERS.map(offer => ({
      ...offer,
      checkoutEnabled,
    }))
  }
}

export function getSubscriptionPlanOffer(planId: string) {
  return SUBSCRIPTION_PLAN_OFFERS.find(offer => offer.id === planId) ?? null
}
