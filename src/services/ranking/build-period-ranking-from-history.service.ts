import { prisma } from '../../lib/prisma'
import { hasActiveProSubscription } from '../../domain/subscription'

export type PeriodRankingScope = 'general' | 'pro'

export type PeriodRankingRow = {
  userId: string
  userName: string
  scoreTotal: number
  scoreRound: number
  totalDoubles: number
  totalSuperDoubles: number
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
            subscription: {
              select: { status: true, plan: true, endAt: true },
            },
          },
        },
      },
    })

    const byUser = new Map<string, Omit<PeriodRankingRow, 'position'>>()
    for (const item of history) {
      const isPro = hasActiveProSubscription(item.user.subscription)
      if (scope === 'pro' && !isPro) continue

      const existing = byUser.get(item.userId)
      if (!existing) {
        byUser.set(item.userId, {
          userId: item.userId,
          userName: item.user.name,
          scoreTotal: item.scoreRound,
          scoreRound: item.scoreRound,
          totalDoubles: item.totalDoubles,
          totalSuperDoubles: item.totalSuperDoubles,
          isPro,
        })
      } else {
        existing.scoreTotal += item.scoreRound
      }
    }

    const rows = Array.from(byUser.values()).sort((a, b) => {
      if (b.scoreTotal !== a.scoreTotal) return b.scoreTotal - a.scoreTotal
      if (b.scoreRound !== a.scoreRound) return b.scoreRound - a.scoreRound
      if (b.totalDoubles !== a.totalDoubles) return b.totalDoubles - a.totalDoubles
      if (b.totalSuperDoubles !== a.totalSuperDoubles) {
        return b.totalSuperDoubles - a.totalSuperDoubles
      }
      return a.userId.localeCompare(b.userId)
    })

    let position = 1
    return rows.map((row, index) => {
      const previous = rows[index - 1]
      if (
        previous &&
        (row.scoreTotal !== previous.scoreTotal ||
          row.scoreRound !== previous.scoreRound ||
          row.totalDoubles !== previous.totalDoubles ||
          row.totalSuperDoubles !== previous.totalSuperDoubles)
      ) {
        position = index + 1
      }
      return { ...row, position }
    })
  }
}
