import { MesaCategory, Prisma } from '@prisma/client'
import { hasActiveProSubscriptionAt } from '../../domain/subscription'
import { RankingWindowRow } from '../ranking/ranking-window-score.service'
import { BolaoPrizeService } from './bolao-prize.service'
import { MesaCategoryRules } from './mesa-category-rules'

type SettlementRanking = {
  id: string
  grossCollected: number
  category?: MesaCategory
  sponsorPrizePool?: number
  prizeDistribution: Prisma.JsonValue | null
  settledAt: Date | null
}

export class SettleBolaoService {
  static async execute(
    tx: Prisma.TransactionClient,
    ranking: SettlementRanking,
    rows: RankingWindowRow[],
    settledAt = new Date()
  ) {
    if (ranking.settledAt) return

    const prizeDistribution = BolaoPrizeService.fromJson(
      ranking.prizeDistribution
    )
    const sponsored = MesaCategoryRules.isSponsored(ranking)
    const totals = sponsored
      ? {
          grossCollected: 0,
          platformFee: 0,
          prizePool: ranking.sponsorPrizePool ?? 0,
        }
      : BolaoPrizeService.calculatePool(ranking.grossCollected)
    const payouts = BolaoPrizeService.calculatePayouts({
      prizePool: totals.prizePool,
      prizeDistribution,
      rows: rows.map(row => ({ userId: row.userId, position: row.position })),
    })
    let eligiblePayouts = payouts
    let withheldPayouts: typeof payouts = []
    if (sponsored && payouts.length > 0) {
      const users = await tx.user.findMany({
        where: { id: { in: payouts.map(payout => payout.userId) } },
        select: {
          id: true,
          subscription: { select: { status: true, startAt: true, endAt: true } },
        },
      })
      const eligibleUserIds = new Set(users
        .filter(user => hasActiveProSubscriptionAt(user.subscription, settledAt))
        .map(user => user.id))
      eligiblePayouts = payouts.filter(payout => eligibleUserIds.has(payout.userId))
      withheldPayouts = payouts.filter(payout => !eligibleUserIds.has(payout.userId))
    }

    for (const payout of eligiblePayouts) {
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
          description: `Recompensa da Mesa ${ranking.id} — ${payout.position}ª posição`,
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
        rewardPool: totals.prizePool,
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
          eligiblePayouts,
          withheldPayouts,
          settledAt: settledAt.toISOString(),
        },
      },
    })
  }
}
