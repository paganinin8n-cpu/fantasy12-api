import { Prisma } from '@prisma/client'

export type PrizeDistributionItem = {
  position: number
  percentage: number
}

type PrizeRow = {
  userId: string
  position: number
}

type Payout = PrizeRow & {
  amount: number
}

export class BolaoPrizeService {
  static validateDistribution(value: unknown): PrizeDistributionItem[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error('Informe ao menos uma faixa de premiação')
    }

    const distribution = value.map((item, index) => {
      const position = Number((item as PrizeDistributionItem)?.position)
      const percentage = Number((item as PrizeDistributionItem)?.percentage)

      if (!Number.isInteger(position) || position !== index + 1) {
        throw new Error('As posições premiadas devem ser sequenciais a partir da 1ª posição')
      }
      if (!Number.isInteger(percentage) || percentage <= 0) {
        throw new Error('Cada percentual de premiação deve ser um número inteiro positivo')
      }

      return { position, percentage }
    })

    if (distribution.reduce((sum, item) => sum + item.percentage, 0) !== 100) {
      throw new Error('Os percentuais de premiação devem somar 100%')
    }

    return distribution
  }

  static fromJson(value: Prisma.JsonValue | null): PrizeDistributionItem[] {
    return this.validateDistribution(value)
  }

  static calculatePool(grossCollected: number) {
    const platformFee = Math.floor(grossCollected * 0.1)
    return {
      grossCollected,
      platformFee,
      prizePool: grossCollected - platformFee,
    }
  }

  static calculatePayouts({
    prizePool,
    prizeDistribution,
    rows,
  }: {
    prizePool: number
    prizeDistribution: PrizeDistributionItem[]
    rows: PrizeRow[]
  }): Payout[] {
    if (prizePool <= 0 || rows.length === 0) return []

    const percentages = new Map(
      prizeDistribution.map(item => [item.position, item.percentage])
    )
    const groups = new Map<number, PrizeRow[]>()
    for (const row of rows) {
      const group = groups.get(row.position) ?? []
      group.push(row)
      groups.set(row.position, group)
    }

    const weightedRows: Array<PrizeRow & { weight: number; order: number }> = []
    let totalWeight = 0
    let order = 0

    for (const [position, tiedRows] of groups) {
      let groupPercentage = 0
      for (let occupiedPosition = position;
        occupiedPosition < position + tiedRows.length;
        occupiedPosition += 1) {
        groupPercentage += percentages.get(occupiedPosition) ?? 0
      }
      if (groupPercentage === 0) continue

      const weight = groupPercentage / tiedRows.length
      for (const row of tiedRows) {
        weightedRows.push({ ...row, weight, order: order++ })
        totalWeight += weight
      }
    }

    if (weightedRows.length === 0 || totalWeight === 0) return []

    const allocated = weightedRows.map(row => {
      const exactAmount = prizePool * row.weight / totalWeight
      const amount = Math.floor(exactAmount)
      return { ...row, amount, remainder: exactAmount - amount }
    })

    let remaining = prizePool - allocated.reduce((sum, row) => sum + row.amount, 0)
    const remainderOrder = [...allocated].sort((a, b) =>
      b.remainder - a.remainder || a.order - b.order
    )
    for (let index = 0; remaining > 0; index = (index + 1) % remainderOrder.length) {
      remainderOrder[index].amount += 1
      remaining -= 1
    }

    return allocated.map(({ userId, position, amount }) => ({
      userId,
      position,
      amount,
    }))
  }
}
