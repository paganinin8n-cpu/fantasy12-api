import { BuildPeriodRankingFromHistoryService } from './build-period-ranking-from-history.service'

type MonthlyRankingScope = 'general' | 'pro'

export class BuildMonthlyRankingFromHistoryService {
  static async execute({
    periodRef,
    scope,
  }: {
    periodRef: string
    scope: MonthlyRankingScope
  }) {
    const match = /^(\d{4})-(\d{2})$/.exec(periodRef)
    if (!match) throw new Error('Invalid period format. Expected YYYY-MM')

    const year = Number(match[1])
    const month = Number(match[2])
    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Expected a value from 01 to 12')
    }

    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))
    const rows = await BuildPeriodRankingFromHistoryService.execute({
      start,
      end,
      scope,
    })

    return rows.map(row => ({
      userId: row.userId,
      userName: row.userName,
      monthlyPoints: row.scoreTotal,
      lastRoundPoints: row.scoreRound,
      totalDoubles: row.totalDoubles,
      totalSuperDoubles: row.totalSuperDoubles,
      isPro: row.isPro,
      position: row.position,
    }))
  }
}
