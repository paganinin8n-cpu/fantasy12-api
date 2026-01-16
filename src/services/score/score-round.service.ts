import { prisma } from '../../lib/prisma';
import { RoundStatus, TicketStatus } from '@prisma/client';

export class ScoreRoundService {
  async execute(roundId: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { tickets: true }
    });

    if (!round) {
      throw new Error('Rodada não encontrada');
    }

    if (round.status !== RoundStatus.CLOSED) {
      throw new Error('Somente rodadas CLOSED podem ser apuradas');
    }

    if (!round.result) {
      throw new Error('Resultado da rodada não definido');
    }

    // 🔒 Idempotência
    if (round.status === RoundStatus.SCORED) {
      return;
    }

    for (const ticket of round.tickets) {
      const scoreRound = this.calculateScore(
        ticket.prediction,
        round.result
      );

      const status =
        scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST;

      // Atualiza ticket
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          scoreRound,
          status
        }
      });

      // Busca último score acumulado
      const lastScore = await prisma.userScoreHistory.findFirst({
        where: { userId: ticket.userId },
        orderBy: { createdAt: 'desc' }
      });

      const scoreTotal = (lastScore?.scoreTotal ?? 0) + scoreRound;

      // Histórico imutável
      await prisma.userScoreHistory.create({
        data: {
          userId: ticket.userId,
          roundId,
          scoreRound,
          scoreTotal
        }
      });
    }

    // Finaliza rodada
    await prisma.round.update({
      where: { id: roundId },
      data: { status: RoundStatus.SCORED }
    });
  }

  private calculateScore(prediction: string, result: string): number {
    const isCorrect = prediction.startsWith(result);

    if (prediction.endsWith('SD')) {
      return isCorrect ? 4 : -4;
    }

    if (prediction.endsWith('D')) {
      return isCorrect ? 2 : -2;
    }

    return isCorrect ? 1 : 0;
  }
}
