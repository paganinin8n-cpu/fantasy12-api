import { prisma } from '../../lib/prisma'
import { hasActiveProSubscription } from '../../domain/subscription'
import { RankingTiebreakService } from './ranking-tiebreak.service'

export type PeriodRankingScope = 'general' | 'pro'

export type PeriodRankingRow = {
  userId: string
  userName: string
  scoreTotal: number
  scoreRound: number
  totalDoubles: number
  totalSuperDoubles: number
  userCreatedAt: Date
  isPro: boolean
  position: number
}

export class BuildPeriodRankingFromHistoryService {
  static async execute({
    start,
    end,
    scope = 'general',
  }: {
    start: Date
    end: Date
    scope?: PeriodRankingScope
  }): Promise<PeriodRankingRow[]> {
    const history = await prisma.userScoreHistory.findMany({
      where: {
        round: {
          status: 'SCORED',
          closeAt: { gte: start, lt: end },
        },
      },
      orderBy: [
        { round: { number: 'desc' } },
        { createdAt: 'desc' },
      ],
      select: {
        userId: true,
        scoreRound: true,
        totalDoubles: true,
        totalSuperDoubles: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            createdAt: true,
            subscription: {
              select: { status: true, plan: true, endAt: true },
            },
          },
        },
      },
    })

    const userIds = [...new Set(history.map(item => item.userId))]
    const baselineHistory = userIds.length === 0
      ? []
      : await prisma.userScoreHistory.findMany({
          where: {
            userId: { in: userIds },
            round: {
              status: 'SCORED',
              closeAt: { lt: start },
            },
          },
          orderBy: [
            { round: { number: 'desc' } },
            { createdAt: 'desc' },
          ],
          select: {
            userId: true,
            totalDoubles: true,
            totalSuperDoubles: true,
          },
        })
    const baselineByUser = new Map<string, {
      totalDoubles: number
      totalSuperDoubles: number
    }>()
    for (const item of baselineHistory) {
      if (!baselineByUser.has(item.userId)) {
        baselineByUser.set(item.userId, item)
      }
    }

    const byUser = new Map<string, Omit<PeriodRankingRow, 'position'>>()
    for (const item of history) {
      const isPro = hasActiveProSubscription(item.user.subscription)
      if (scope === 'pro' && !isPro) continue

      const existing = byUser.get(item.userId)
      if (!existing) {
        const hits = RankingTiebreakService.calculateWindowHits(
          item,
          baselineByUser.get(item.userId)
        )
        byUser.set(item.userId, {
          userId: item.userId,
          userName: item.user.name,
          scoreTotal: item.scoreRound,
          scoreRound: item.scoreRound,
          totalDoubles: hits.doubleHits,
          totalSuperDoubles: hits.superDoubleHits,
          userCreatedAt: item.user.createdAt,
          isPro,
        })
      } else {
        existing.scoreTotal += item.scoreRound
      }
    }

    return RankingTiebreakService.rank(
      Array.from(byUser.values()),
      row => ({
        userId: row.userId,
        scoreRanking: row.scoreTotal,
        superDoubleHits: row.totalSuperDoubles,
        doubleHits: row.totalDoubles,
        userCreatedAt: row.userCreatedAt,
      })
    )
  }
}
