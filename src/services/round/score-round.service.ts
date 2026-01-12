import { prisma } from '../../lib/prisma';
import { RoundRepository } from '../../repositories/round.repository';
import { TicketRepository } from '../../repositories/ticket.repository';
import { UserScoreHistoryRepository } from '../../repositories/user-score-history.repository';
import { RoundStatus, TicketStatus } from '@prisma/client';

export class ScoreRoundService {
  private roundRepo = new RoundRepository();
  private ticketRepo = new TicketRepository();
  private historyRepo = new UserScoreHistoryRepository();

  /**
   * Apura a rodada:
   * - calcula score de cada ticket
   * - persiste scoreRound no ticket
   * - gera histórico cumulativo por usuário
   */
  async execute(roundId: string): Promise<void> {
    const round = await this.roundRepo.findById(roundId);

    if (!round) {
      throw new Error('Rodada não encontrada');
    }

    if (round.status !== RoundStatus.CLOSED) {
      throw new Error('Rodada não está fechada para apuração');
    }

    if (!round.result) {
      throw new Error('Resultado da rodada não informado');
    }

    const tickets = await this.ticketRepo.findByRound(roundId);
    const resultArray = round.result.split('-');

    await prisma.$transaction(async () => {
      for (const ticket of tickets) {
        const predictionArray = ticket.prediction.split('-');

        let scoreRound = 0;

        predictionArray.forEach((prediction: string, index: number) => {
          if (prediction === resultArray[index]) {
            scoreRound += 1;
          }
        });

        // Atualiza score do ticket
        await this.ticketRepo.updateScore(ticket.id, scoreRound);

        // Define status do ticket
        const ticketStatus =
          scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST;

        await this.ticketRepo.updateStatus(ticket.id, ticketStatus);

        // Busca último score acumulado do usuário
        const lastHistory = await this.historyRepo.findLastByUser(ticket.userId);
        const lastTotal = lastHistory ? lastHistory.scoreTotal : 0;

        // Cria histórico cumulativo
        await this.historyRepo.create({
          userId: ticket.userId,
          roundId,
          scoreRound,
          scoreTotal: lastTotal + scoreRound
        });
      }

      // Mantemos CLOSED neste bloco (SCORED vem depois)
      await this.roundRepo.updateStatus(roundId, RoundStatus.CLOSED);
    });
  }
}
