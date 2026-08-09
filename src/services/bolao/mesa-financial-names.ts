type LegacyFinancialNames = {
  entryFee: number
  prizePool: number
}

/**
 * Exposes the canonical Mesa domain names while old clients are still active.
 * Legacy aliases are intentionally retained until the contract phase.
 */
export function withMesaFinancialNames<T extends LegacyFinancialNames>(value: T) {
  return {
    ...value,
    accessCost: value.entryFee,
    rewardPool: value.prizePool,
  }
}

export function resolveAccessCost(input: {
  accessCost?: number
  entryFee?: number
}) {
  return input.accessCost ?? input.entryFee ?? 0
}
