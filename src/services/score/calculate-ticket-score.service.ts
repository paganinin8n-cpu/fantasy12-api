export class CalculateTicketScoreService {

  execute(
    prediction: string,
    result: string,
    multipliers: number[]
  ): number {

    const predictionArr = prediction.split(',')
    const resultArr = result.split(',')

    if (predictionArr.length !== resultArr.length) {
      throw new Error('Prediction and result length mismatch')
    }

    if (multipliers.length !== predictionArr.length) {
      throw new Error('Multipliers length mismatch')
    }

    let score = 0

    for (let i = 0; i < predictionArr.length; i++) {

      const hit = predictionArr[i] === resultArr[i]
      const multiplier = multipliers[i]

      if (![1,2,4].includes(multiplier)) {
        throw new Error('Invalid multiplier')
      }

      if (hit) {

        score += multiplier

      } else {

        if (multiplier === 1) {
          score += 0
        }

        if (multiplier === 2) {
          score -= 2
        }

        if (multiplier === 4) {
          score -= 4
        }

      }

    }

    return score

  }

}