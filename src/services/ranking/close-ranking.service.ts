import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from './ranking-window-score.service';

export class CloseRankingService {
  async execute(rankingId: string) {
    await prisma.$transaction(async (tx) => {
      /**
       * 1️⃣ Buscar ranking
       */
      const ranking = await tx.ranking.findUnique({
        where: { id: rankingId },
        select: {
          id: true,
          status: true,
          endDate: true,
          startDate: true,
        },
      });

      if (!ranking) {
        throw new Error('Ranking não encontrado');
      }

      if (ranking.status !== 'ACTIVE') {
        throw new Error('Ranking já está encerrado');
      }

      if (!ranking.endDate || ranking.endDate > new Date()) {
        throw new Error('Ranking ainda não expirou');
      }

      const rows = await RankingWindowScoreService.buildRows(tx, ranking);

      for (const row of rows) {
        await tx.rankingParticipant.update({
          where: { id: row.participantId },
          data: {
            score: row.score,
            position: row.position,
          },
        });
      }

      /**
       * 5️⃣ Fechar ranking
       */
      await tx.ranking.update({
        where: { id: rankingId },
        data: {
          status: 'CLOSED',
        },
      });
    });
  }
}
