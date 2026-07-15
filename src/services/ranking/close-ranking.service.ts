import { prisma } from '../../lib/prisma';
import { RankingWindowScoreService } from './ranking-window-score.service';
import { SettleBolaoService } from '../bolao/settle-bolao.service';

export class CloseRankingService {
  async execute(rankingId: string, options: { force?: boolean } = {}) {
    await prisma.$transaction(async (tx) => {
      /**
       * 1️⃣ Buscar ranking
       */
      const ranking = await tx.ranking.findUnique({
        where: { id: rankingId },
        select: {
          id: true,
          type: true,
          status: true,
          endDate: true,
          startDate: true,
          grossCollected: true,
          prizeDistribution: true,
          settledAt: true,
        },
      });

      if (!ranking) {
        throw new Error('Ranking não encontrado');
      }

      if (ranking.status === 'CLOSED') {
        throw new Error('Ranking já está encerrado');
      }

      const isBolao = ranking.type === 'BOLAO';
      const allowedStatuses = isBolao ? ['ACTIVE', 'DRAFT'] : ['ACTIVE'];
      if (!allowedStatuses.includes(ranking.status)) {
        throw new Error('Ranking não pode ser encerrado neste estado');
      }

      if (!options.force && (!ranking.endDate || ranking.endDate > new Date())) {
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

      if (isBolao) {
        await SettleBolaoService.execute(tx, ranking, rows);
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
