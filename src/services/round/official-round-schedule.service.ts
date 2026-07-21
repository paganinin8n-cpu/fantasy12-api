import type { RoundMatchInput } from './round-match.types'
import { normalizeRoundMatches } from './round-match.types'
import { SaoPauloPeriodService } from '../time/sao-paulo-period.service'

const HOUR_MS = 60 * 60 * 1000

type RoundScheduleOverride = {
  openAt?: Date | string | null
  closeAt?: Date | string | null
}

function parseOverrideDate(value: Date | string | null | undefined, field: string) {
  if (value === null || value === undefined || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} inválido`)
  }
  return date
}

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

  static resolve(input: RoundMatchInput[], override: RoundScheduleOverride = {}) {
    const derived = this.derive(input)
    const openAt = parseOverrideDate(override.openAt, 'Horário de abertura') ?? derived.openAt
    const closeAt = parseOverrideDate(override.closeAt, 'Horário de fechamento') ?? derived.closeAt

    if (openAt.getTime() >= closeAt.getTime()) {
      throw new Error('A abertura da rodada deve ocorrer antes do fechamento')
    }

    if (closeAt.getTime() > derived.earliestMatchTime.getTime()) {
      throw new Error('O fechamento da rodada não pode ocorrer depois do primeiro jogo')
    }

    return {
      ...derived,
      openAt,
      closeAt,
    }
  }
}
