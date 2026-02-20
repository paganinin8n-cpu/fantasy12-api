import { prisma } from '../../lib/prisma';
import { RoundStatus } from '@prisma/client';
import { ScoreRoundService } from './score-round.service';

export class RoundAdminService {
  private scoringService = new ScoreRoundService();

  /**
   * Fecha oficialmente uma rodada e dispara apuração.
   *
   * Fluxo oficial:
   * 1️⃣ Validar existência
   * 2️⃣ Validar resultado informado
   * 3️⃣ Validar estado permitido
   * 4️⃣ Se OPEN → mover para CLOSED
   * 5️⃣ Disparar RoundScoringService
   *
   * IMPORTANTE:
   * - Apenas rodadas CLOSED podem virar SCORED
   * - RoundScoringService é responsável por:
   *   - Calcular score
   *   - Atualizar histórico
   *   - Marcar como SCORED
   *   - Gerar snapshot
   */
  async closeRound(roundId: string): Promise<void> {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        status: true,
        result: true,
      },
    });

    if (!round) {
      throw new Error('Rodada não encontrada');
    }

    if (!round.result) {
      throw new Error('Resultado da rodada não informado');
    }

    if (round.status === RoundStatus.SCORED) {
      throw new Error('Rodada já foi apurada');
    }

    if (
      round.status !== RoundStatus.OPEN &&
      round.status !== RoundStatus.CLOSED
    ) {
      throw new Error('Rodada não pode ser fechada neste estado');
    }

    /**
     * Se ainda estiver OPEN, primeiro fechar oficialmente
     */
    if (round.status === RoundStatus.OPEN) {
      await prisma.round.update({
        where: { id: roundId },
        data: {
          status: RoundStatus.CLOSED,
          closeAt: new Date(),
        },
      });
    }

    /**
     * Dispara apuração oficial
     *
     * RoundScoringService:
     * - valida estado CLOSED
     * - calcula score
     * - atualiza user_score_history
     * - marca rodada como SCORED
     * - chama SnapshotRankingService
     */
    await this.scoringService.execute(roundId);
  }
}
