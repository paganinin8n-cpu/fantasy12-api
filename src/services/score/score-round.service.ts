import { prisma } from '../../lib/prisma';
import { RoundStatus, TicketStatus } from '@prisma/client';
import { CalculateTicketScoreService } from './calculate-ticket-score.service';

export class ScoreRoundService {
  private calculator = new CalculateTicketScoreService();

  /**
   * Executa a apuração oficial de uma rodada.
   * ⚠️ Deve ser chamado EXCLUSIVAMENTE por job interno.
   */
  async execute(roundId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1️⃣ Carregar rodada e tickets
      const round = await tx.round.findUnique({
        where: { id: roundId },
        include: {
          tickets: true,
        },
      });

      if (!round) {
        throw new Error('Rodada não encontrada');
      }

      // 🔒 Idempotência absoluta
      if (round.status === RoundStatus.SCORED) {
        return;
      }

      if (round.status !== RoundStatus.CLOSED) {
        throw new Error('Somente rodadas CLOSED podem ser apuradas');
      }

      if (!round.result) {
        throw new Error('Resultado da rodada não definido');
      }

      // 2️⃣ Processar tickets
      for (const ticket of round.tickets) {
        const scoreRound = this.calculator.execute(
          ticket.prediction,
          round.result
        );

        const status =
          scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST;

        // 3️⃣ Atualizar ticket (resultado IMUTÁVEL)
        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            scoreRound,
            status,
          },
        });

        // 4️⃣ Buscar último score acumulado (ordenado pelo maior total)
        const lastHistory = await tx.userScoreHistory.findFirst({
          where: { userId: ticket.userId },
          orderBy: { scoreTotal: 'desc' },
        });

        const previousTotal = lastHistory?.scoreTotal ?? 0;
        const scoreTotal = previousTotal + scoreRound;

        // 5️⃣ Criar histórico (INSERT ONLY)
        await tx.userScoreHistory.create({
          data: {
            userId: ticket.userId,
            roundId,
            scoreRound,
            scoreTotal,
          },
        });
      }

      // 6️⃣ Finalizar rodada
      await tx.round.update({
        where: { id: roundId },
        data: {
          status: RoundStatus.SCORED,
        },
      });
    });
  }
}