export class CalculateTicketScoreService {
  execute(prediction: string, result: string): number {
    const isCorrect = prediction.startsWith(result);

    // Super Dupla
    if (prediction.endsWith('SD')) {
      return isCorrect ? 4 : -4;
    }

    // Dupla
    if (prediction.endsWith('D')) {
      return isCorrect ? 2 : -2;
    }

    // Simples
    return isCorrect ? 1 : 0;
  }
}
