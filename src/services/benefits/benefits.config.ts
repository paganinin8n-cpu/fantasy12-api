/**
 * Fonte única de verdade para custos de benefícios pagos
 *
 * ⚠️ Valores em COINS
 * ⚠️ Alterações aqui impactam monetização
 */
export const BENEFIT_COST = {
  DOUBLE: 1,
  SUPER_DOUBLE: 2,
} as const

export type PaidBenefitType = keyof typeof BENEFIT_COST

export const BENEFIT_PURCHASE_PACKAGES = {
  double_single: {
    id: 'double_single',
    type: 'DOUBLE',
    quantity: 1,
    cost: 4,
    label: 'Dupla Simples',
  },
  double_combo: {
    id: 'double_combo',
    type: 'DOUBLE',
    quantity: 3,
    cost: 10,
    label: 'Combo Tático',
  },
  double_total: {
    id: 'double_total',
    type: 'DOUBLE',
    quantity: 10,
    cost: 20,
    label: 'Estratégia Total',
  },
  super_single: {
    id: 'super_single',
    type: 'SUPER_DOUBLE',
    quantity: 1,
    cost: 5,
    label: 'Super Jogada',
  },
  super_master: {
    id: 'super_master',
    type: 'SUPER_DOUBLE',
    quantity: 4,
    cost: 20,
    label: 'Mestre da Rodada',
  },
} as const

export type BenefitPurchasePackageId = keyof typeof BENEFIT_PURCHASE_PACKAGES
