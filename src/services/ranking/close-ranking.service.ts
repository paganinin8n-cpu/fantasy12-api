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
        const changed =
          row.previousScore !== row.score ||
          row.previousPosition !== row.position;

        await tx.rankingParticipant.update({
          where: { id: row.participantId },
          data: {
            score: row.score,
            position: row.position,
          },
        });

        if (changed) {
          await tx.auditLog.create({
            data: {
              userId: row.userId,
              action: 'RANKING_PARTICIPANT_SCORE_RECALCULATED',
              entity: 'RANKING_PARTICIPANT',
              entityId: row.participantId,
              metadata: {
                rankingId,
                previousScore: row.previousScore,
                score: row.score,
                previousPosition: row.previousPosition,
                position: row.position,
                scoreInitial: row.scoreInitial,
                scoreTotalCurrent: row.scoreTotalCurrent,
                formula: 'scoreTotalCurrent - scoreInitial',
              },
            },
          });
        }
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

      await tx.auditLog.create({
        data: {
          action: 'RANKING_CLOSED',
          entity: 'RANKING',
          entityId: rankingId,
          metadata: {
            rows: rows.length,
            formula: 'scoreTotalCurrent - scoreInitial',
          },
        },
      });
    });
  }
}
