import { Prisma } from '@prisma/client'
import { RankingWindowRow } from '../ranking/ranking-window-score.service'
import { BolaoPrizeService } from './bolao-prize.service'

type SettlementRanking = {
  id: string
  grossCollected: number
  prizeDistribution: Prisma.JsonValue | null
  settledAt: Date | null
}

export class SettleBolaoService {
  static async execute(
    tx: Prisma.TransactionClient,
    ranking: SettlementRanking,
    rows: RankingWindowRow[]
  ) {
    if (ranking.settledAt) return

    const prizeDistribution = BolaoPrizeService.fromJson(
      ranking.prizeDistribution
    )
    const totals = BolaoPrizeService.calculatePool(ranking.grossCollected)
    const payouts = BolaoPrizeService.calculatePayouts({
      prizePool: totals.prizePool,
      prizeDistribution,
      rows: rows.map(row => ({ userId: row.userId, position: row.position })),
    })
    const settledAt = new Date()

    for (const payout of payouts) {
      const wallet = await tx.wallet.upsert({
        where: { userId: payout.userId },
        update: {},
        create: { userId: payout.userId },
        select: { id: true },
      })

      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          type: 'CREDIT',
          amount: payout.amount,
          description: `Premiação da Mesa ${ranking.id} — ${payout.position}ª posição`,
          idempotencyKey: `bolao:payout:${ranking.id}:${payout.userId}`,
        },
      })
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: payout.amount } },
      })
    }

    await tx.ranking.update({
      where: { id: ranking.id, settledAt: null },
      data: {
        platformFee: totals.platformFee,
        prizePool: totals.prizePool,
        settledAt,
      },
    })

    await tx.auditLog.create({
      data: {
        action: 'BOLAO_SETTLED',
        entity: 'RANKING',
        entityId: ranking.id,
        metadata: {
          ...totals,
          prizeDistribution,
          payouts,
          settledAt: settledAt.toISOString(),
        },
      },
    })
  }
}
