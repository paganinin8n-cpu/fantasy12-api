import type { RoundMatchInput } from './round-match.types'
import { normalizeRoundMatches } from './round-match.types'
import { SaoPauloPeriodService } from '../time/sao-paulo-period.service'

const HOUR_MS = 60 * 60 * 1000

export class OfficialRoundScheduleService {
  static derive(input: RoundMatchInput[]) {
    const matches = normalizeRoundMatches(input)
    if (matches.some(match => !match.matchTime)) {
      throw new Error('Informe o horário dos 12 jogos para calcular o calendário oficial')
    }

    const earliestMatchTime = new Date(Math.min(
      ...matches.map(match => match.matchTime!.getTime())
    ))
    const local = SaoPauloPeriodService.parts(earliestMatchTime)
    const weekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay()
    if (weekday !== 3 && weekday !== 6) {
      throw new Error('O primeiro jogo da rodada oficial deve ocorrer na quarta-feira ou sábado')
    }

    const previousDay = new Date(Date.UTC(local.year, local.month - 1, local.day - 1))
    return {
      openAt: SaoPauloPeriodService.fromLocal({
        year: previousDay.getUTCFullYear(),
        month: previousDay.getUTCMonth() + 1,
        day: previousDay.getUTCDate(),
      }),
      closeAt: new Date(earliestMatchTime.getTime() - HOUR_MS),
      earliestMatchTime,
      matches,
    }
  }
}
