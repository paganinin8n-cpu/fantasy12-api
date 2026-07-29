import { prisma } from '../../lib/prisma'
import { RankingWindowScoreService } from './ranking-window-score.service'
import { RANKING_TIEBREAK_RULE_VERSION } from './ranking-tiebreak.service'

export class RecalculateRankingService {

  static async execute(): Promise<void> {
    const rankings = await prisma.ranking.findMany({
      where: {
        OR: [
          { status: 'ACTIVE', startDate: { not: null } },
          { type: 'BOLAO', status: 'DRAFT' },
        ],
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    })

    const now = new Date()

    for (const ranking of rankings) {
      // Mesas/rankings já expirados são finalizados pelo job de close —
      // recalcular depois do endDate zerava scores quando faltava histórico.
      if (ranking.endDate != null && ranking.endDate <= now) {
        continue
      }

      // Uma transaction por ranking evita lock longo que trava criar/entrar em Mesa.
      await prisma.$transaction(async tx => {
        const rows = await RankingWindowScoreService.buildRows(tx, ranking, now)

        for (const row of rows) {
          const changed =
            row.previousScore !== row.score ||
            row.previousPosition !== row.position

          await tx.rankingParticipant.update({
            where: { id: row.participantId },
            data: {
              score: row.score,
              position: row.position,
              tiebreakSuperDoubleHits: row.superDoubleHits,
              tiebreakDoubleHits: row.doubleHits,
              tiebreakUserCreatedAt: row.userCreatedAt,
              tiebreakRuleVersion: RANKING_TIEBREAK_RULE_VERSION,
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
                  superDoubleHits: row.superDoubleHits,
                  doubleHits: row.doubleHits,
                  userCreatedAt: row.userCreatedAt.toISOString(),
                  tiebreakRuleVersion: RANKING_TIEBREAK_RULE_VERSION,
                },
              },
            })
          }
        }
      })
    }
  }

}
