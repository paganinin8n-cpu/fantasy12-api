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
          await tx.rankingParticipant.update({
            where: { id: row.participantId },
            data: {
              score: row.score,
              position: row.position,
            },
          })
        }
      }
    })
  }

}
