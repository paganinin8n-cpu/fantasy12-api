import { prisma } from '../../lib/prisma'
import { RankingWindowScoreService } from './ranking-window-score.service'

export class RecalculateRankingService {

  static async execute(): Promise<void> {
    await prisma.$transaction(async tx => {
      const rankings = await tx.ranking.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { not: null },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
        },
      })

      for (const ranking of rankings) {
        const rows = await RankingWindowScoreService.buildRows(tx, ranking)

        for (const row of rows) {
          const changed =
            row.previousScore !== row.score ||
            row.previousPosition !== row.position

          await tx.rankingParticipant.update({
            where: { id: row.participantId },
            data: {
              score: row.score,
              position: row.position,
            },
          })

          if (changed) {
            await tx.auditLog.create({
              data: {
                userId: row.userId,
                action: 'RANKING_PARTICIPANT_SCORE_RECALCULATED',
                entity: 'RANKING_PARTICIPANT',
                entityId: row.participantId,
                metadata: {
                  rankingId: ranking.id,
                  previousScore: row.previousScore,
                  score: row.score,
                  previousPosition: row.previousPosition,
                  position: row.position,
                  scoreInitial: row.scoreInitial,
                  scoreTotalCurrent: row.scoreTotalCurrent,
                  formula: 'scoreTotalCurrent - scoreInitial',
                },
              },
            })
          }
        }
      }
    })
  }

}
