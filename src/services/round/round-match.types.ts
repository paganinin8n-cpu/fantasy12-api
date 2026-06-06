export type RoundMatchInput = {
  position: number
  homeTeam: string
  awayTeam: string
  groupLabel?: string | null
  matchTime?: Date | string | null
}

export type RoundMatchResultInput = {
  position: number
  result: string
}

export const ROUND_MATCH_COUNT = 12
export const VALID_MATCH_RESULTS = ['1', 'X', '2'] as const

export function normalizeRoundMatches(matches: RoundMatchInput[]) {
  if (!Array.isArray(matches) || matches.length !== ROUND_MATCH_COUNT) {
    throw new Error('A rodada precisa conter exatamente 12 jogos')
  }

  const positions = new Set<number>()

  return matches
    .map((match, index) => {
      const position = Number(match.position ?? index + 1)
      const homeTeam = String(match.homeTeam ?? '').trim()
      const awayTeam = String(match.awayTeam ?? '').trim()
      const groupLabel = match.groupLabel ? String(match.groupLabel).trim() : null
      const matchTime = match.matchTime ? new Date(match.matchTime) : null

      if (!Number.isInteger(position) || position < 1 || position > ROUND_MATCH_COUNT) {
        throw new Error('Cada jogo precisa ter posição entre 1 e 12')
      }

      if (positions.has(position)) {
        throw new Error('A rodada não pode ter jogos com posição repetida')
      }

      if (!homeTeam || !awayTeam) {
        throw new Error('Cada jogo precisa informar mandante e visitante')
      }

      if (matchTime && Number.isNaN(matchTime.getTime())) {
        throw new Error('Horário de jogo inválido')
      }

      positions.add(position)

      return {
        position,
        homeTeam,
        awayTeam,
        groupLabel,
        matchTime,
      }
    })
    .sort((a, b) => a.position - b.position)
}

export function normalizeRoundResult(result: string) {
  const values = String(result ?? '')
    .split(',')
    .map(item => item.trim().toUpperCase())

  if (values.length !== ROUND_MATCH_COUNT) {
    throw new Error('O resultado precisa conter os 12 jogos da rodada')
  }

  for (const value of values) {
    if (!VALID_MATCH_RESULTS.includes(value as typeof VALID_MATCH_RESULTS[number])) {
      throw new Error('Cada resultado precisa ser 1, X ou 2')
    }
  }

  return values
}
