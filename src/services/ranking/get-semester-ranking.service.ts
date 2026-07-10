import { BuildPeriodRankingFromHistoryService } from './build-period-ranking-from-history.service'

export class GetSemesterRankingService {
  static async execute(periodRef: string) {
    const match = /^(\d{4})-S([12])$/.exec(periodRef)
    if (!match) {
      throw new Error('Invalid period format. Expected YYYY-S1 or YYYY-S2')
    }

    const year = Number(match[1])
    const semester = Number(match[2])
    const startMonth = semester === 1 ? 0 : 6
    const start = new Date(Date.UTC(year, startMonth, 1))
    const end = new Date(Date.UTC(year, startMonth + 6, 1))

    return BuildPeriodRankingFromHistoryService.execute({ start, end })
  }
}
