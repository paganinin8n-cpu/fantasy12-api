export type TicketScoreBreakdown = {
  hits: number
  misses: number
  doubleHits: number
  doubleMisses: number
  superDoubleHits: number
  superDoubleMisses: number
  basePoints: number
  multiplierBonus: number
  multiplierPenalty: number
  total: number
}

export class CalculateTicketScoreService {

  private readonly MATCH_COUNT = 12

  detail(
    prediction: string,
    result: string,
    multipliers: number[]
  ): TicketScoreBreakdown {

    const predictionArr = prediction.split(',')
    const resultArr = result.split(',')

    /**
     * validação estrutural
     */
    if (predictionArr.length !== this.MATCH_COUNT) {
      throw new Error('Prediction must contain 12 matches')
    }

    if (resultArr.length !== this.MATCH_COUNT) {
      throw new Error('Result must contain 12 matches')
    }

    if (multipliers.length !== this.MATCH_COUNT) {
      throw new Error('Multipliers must contain 12 matches')
    }

    let hits = 0
    let misses = 0
    let doubleHits = 0
    let doubleMisses = 0
    let superDoubleHits = 0
    let superDoubleMisses = 0
    let basePoints = 0
    let multiplierBonus = 0
    let multiplierPenalty = 0

    for (let i = 0; i < this.MATCH_COUNT; i++) {

      const pred = predictionArr[i]
      const res = resultArr[i]
      const multiplier = multipliers[i]

      if (![1,2,4].includes(multiplier)) {
        throw new Error('Invalid multiplier')
      }

      if (res === 'C') {
        continue
      }

      const hit = pred === res

      if (hit) {
        hits++
        basePoints += 1

        if (multiplier === 2) {
          doubleHits++
          multiplierBonus += 1
        }

        if (multiplier === 4) {
          superDoubleHits++
          multiplierBonus += 3
        }

      } else {
        misses++

        if (multiplier === 2) {
          doubleMisses++
          multiplierPenalty += 2
        }

        if (multiplier === 4) {
          superDoubleMisses++
          multiplierPenalty += 4
        }

      }

    }

    const total = basePoints + multiplierBonus - multiplierPenalty

    return {
      hits,
      misses,
      doubleHits,
      doubleMisses,
      superDoubleHits,
      superDoubleMisses,
      basePoints,
      multiplierBonus,
      multiplierPenalty,
      total,
    }

  }

  execute(
    prediction: string,
    result: string,
    multipliers: number[]
  ): number {

    return this.detail(prediction, result, multipliers).total

  }

}
