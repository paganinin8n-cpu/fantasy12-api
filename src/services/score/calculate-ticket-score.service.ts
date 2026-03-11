export class CalculateTicketScoreService {

  private readonly MATCH_COUNT = 12
  private readonly MIN_ROUND_SCORE = -24

  execute(
    prediction: string,
    result: string,
    multipliers: number[]
  ): number {

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

    let score = 0

    for (let i = 0; i < this.MATCH_COUNT; i++) {

      const pred = predictionArr[i]
      const res = resultArr[i]
      const multiplier = multipliers[i]

      if (![1,2,4].includes(multiplier)) {
        throw new Error('Invalid multiplier')
      }

      const hit = pred === res

      if (hit) {

        score += multiplier

      } else {

        if (multiplier === 2) score -= 2
        if (multiplier === 4) score -= 4

      }

    }

    /**
     * proteção contra score negativo extremo
     */
    if (score < this.MIN_ROUND_SCORE) {
      score = this.MIN_ROUND_SCORE
    }

    return score

  }

}