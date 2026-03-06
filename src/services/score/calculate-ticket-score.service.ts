export class CalculateTicketScoreService {
  execute(prediction: string, result: string): number {
    const predictionArr = prediction.split(',');
    const resultArr = result.split(',');

    if (predictionArr.length !== resultArr.length) {
      throw new Error('Prediction and result length mismatch');
    }

    let correct = 0;

    for (let i = 0; i < predictionArr.length; i++) {
      if (predictionArr[i] === resultArr[i]) {
        correct++;
      }
    }

    return correct;
  }
}