import { BuildPeriodRankingFromHistoryService } from './build-period-ranking-from-history.service'

export class GetWeeklyRankingService {
  static async execute(periodRef: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(periodRef)
    if (!match) throw new Error('Invalid period format. Expected YYYY-WW')

    const year = Number(match[1])
    const week = Number(match[2])
    if (week < 1 || week > 53) {
      throw new Error('Invalid ISO week. Expected a value from 01 to 53')
    }

    const januaryFourth = new Date(Date.UTC(year, 0, 4))
    const day = januaryFourth.getUTCDay() || 7
    const firstMonday = new Date(januaryFourth)
    firstMonday.setUTCDate(januaryFourth.getUTCDate() - day + 1)

    const start = new Date(firstMonday)
    start.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 7)

    return BuildPeriodRankingFromHistoryService.execute({ start, end })
  }
}
