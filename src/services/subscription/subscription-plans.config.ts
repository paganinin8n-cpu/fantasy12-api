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

/** Ordem comercial: Mensal → Anual PIX (destaque) → Anual Cartão */
export const SUBSCRIPTION_PLAN_OFFERS: SubscriptionPlanOffer[] = [
  {
    id: 'pro_monthly',
    plan: 'MONTHLY',
    paymentMethod: 'CARD',
    title: 'PRO Mensal',
    subtitle: 'R$ 24,90/mês',
    amountCents: 2490,
    installments: 1,
    installmentCents: null,
    totalCents: 2490,
    badge: null,
    benefits: [
      '4 Duplas grátis por rodada',
      '2 Super Duplas grátis por rodada',
      'Compra de Duplas e Super Duplas com tampinhas',
      'Participe de Mesas Exclusivas',
      'Ranking PRO exclusivo',
    ],
    checkoutEnabled: true,
  },
  {
    id: 'pro_annual_pix',
    plan: 'ANNUAL',
    paymentMethod: 'PIX',
    title: 'PRO Anual · PIX',
    subtitle: 'R$ 99,00/ano',
    amountCents: 9900,
    installments: 1,
    installmentCents: null,
    totalCents: 9900,
    badge: 'Pague 10 meses e receba 12',
    benefits: [
      '4 Duplas grátis por rodada',
      '2 Super Duplas grátis por rodada',
      'Compra de Duplas e Super Duplas com tampinhas',
      'Mesas Exclusivas + criar mesas',
      'Ranking PRO exclusivo',
      'Economize mais de 65%',
    ],
    checkoutEnabled: true,
  },
  {
    id: 'pro_annual_card',
    plan: 'ANNUAL',
    paymentMethod: 'CARD',
    title: 'PRO Anual no Cartão',
    subtitle: '12x R$ 9,90',
    amountCents: 11880,
    installments: 12,
    installmentCents: 990,
    totalCents: 11880,
    badge: null,
    benefits: [
      '4 Duplas grátis por rodada',
      '2 Super Duplas grátis por rodada',
      'Compra de Duplas e Super Duplas com tampinhas',
      'Mesas Exclusivas + criar mesas',
      'Ranking PRO exclusivo',
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
