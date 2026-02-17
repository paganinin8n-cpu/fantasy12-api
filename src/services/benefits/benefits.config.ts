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
