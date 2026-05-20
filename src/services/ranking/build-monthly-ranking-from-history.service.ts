import { prisma } from '../../lib/prisma'
import { hasActiveProSubscription } from '../../domain/subscription'

type MonthlyRankingScope = 'general' | 'pro'

type RankingHistoryRow = {
  userId: string
  userName: string
  monthlyPoints: number
  lastRoundPoints: number
  isPro: boolean
}

export class BuildMonthlyRankingFromHistoryService {
  static async execute({
    periodRef,
    scope,
  }: {
    periodRef: string
    scope: MonthlyRankingScope
  }) {
    if (!/^\d{4}-\d{2}$/.test(periodRef)) {
      throw new Error('Invalid period format. Expected YYYY-MM')
    }

    const [yearStr, monthStr] = periodRef.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1

    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0))

    const history = await prisma.userScoreHistory.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { roundId: 'desc' },
      ],
      select: {
        userId: true,
        scoreRound: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            subscription: {
              select: {
                status: true,
                plan: true,
                endAt: true,
              },
            },
          },
        },
      },
    })

    const byUser = new Map<string, RankingHistoryRow>()

    for (const item of history) {
      const isPro = hasActiveProSubscription(item.user.subscription)

      if (scope === 'pro' && !isPro) {
        continue
      }

      const existing = byUser.get(item.userId)

      if (!existing) {
        byUser.set(item.userId, {
          userId: item.userId,
          userName: item.user.name,
          monthlyPoints: item.scoreRound,
          lastRoundPoints: item.scoreRound,
          isPro,
        })
        continue
      }

      existing.monthlyPoints += item.scoreRound
    }

    return Array.from(byUser.values()).sort((a, b) => {
      if (b.monthlyPoints !== a.monthlyPoints) {
        return b.monthlyPoints - a.monthlyPoints
      }

      if (b.lastRoundPoints !== a.lastRoundPoints) {
        return b.lastRoundPoints - a.lastRoundPoints
      }

      return a.userId.localeCompare(b.userId)
    })
  }
}
