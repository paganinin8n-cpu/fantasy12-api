import { Prisma } from '@prisma/client'
import { RankingTiebreakService } from './ranking-tiebreak.service'

type RankingScoreClient = Pick<
  Prisma.TransactionClient,
  'rankingParticipant' | 'userScoreHistory'
>

type RankingWindow = {
  id: string
  startDate: Date | null
  endDate: Date | null
}

export type RankingWindowRow = {
  participantId: string
  userId: string
  score: number
  scoreRound: number
  position: number
  scoreInitial: number
  scoreTotalCurrent: number
  superDoubleHits: number
  doubleHits: number
  userCreatedAt: Date
  previousScore: number
  previousPosition: number | null
}

export class RankingWindowScoreService {
  static calculateScoreFromBaseline(
    scoreTotalCurrent: number,
    scoreInitial: number
  ) {
    return scoreTotalCurrent - scoreInitial
  }

  static async getScoreTotalBefore(
    tx: RankingScoreClient,
    userId: string,
    date: Date
  ) {
    const history = await tx.userScoreHistory.findFirst({
      where: { userId, round: { closeAt: { lt: date } } },
      orderBy: [{ round: { closeAt: 'desc' } }, { createdAt: 'desc' }],
      select: { scoreTotal: true },
    })
    if (history) return history.scoreTotal

    // Sem rodada anterior, o acumulado inicial oficial é zero.
    // Usar o scoreTotal vivo aqui faria uma rodada posterior ao início
    // contaminar o baseline da Mesa.
    return 0
  }

  static async buildRows(
    tx: RankingScoreClient,
    ranking: RankingWindow,
    now = new Date()
  ): Promise<RankingWindowRow[]> {
    const participants = await tx.rankingParticipant.findMany({
      where: { rankingId: ranking.id, status: 'APPROVED' },
      select: {
        id: true,
        userId: true,
        score: true,
        scoreInitial: true,
        position: true,
        approvedAt: true,
        createdAt: true,
        user: {
          select: {
            scoreTotal: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (participants.length === 0) {
      return []
    }

    const participantIds = participants.map(participant => participant.userId)
    const endDate = ranking.endDate ?? new Date()

    const historyRows = await tx.userScoreHistory.findMany({
      where: {
        userId: { in: participantIds },
        round: {
          closeAt: {
            lte: endDate,
          },
        },
      },
      select: {
        userId: true,
        scoreTotal: true,
        scoreRound: true,
        totalDoubles: true,
        totalSuperDoubles: true,
        createdAt: true,
        round: {
          select: { closeAt: true },
        },
      },
      orderBy: [
        { round: { closeAt: 'desc' } },
        { createdAt: 'desc' },
      ],
    })

    const rows = participants.map(participant => {
      const latestHistory = historyRows.find(row =>
        row.userId === participant.userId
      )
      const baselineHistory = ranking.startDate
        ? historyRows.find(row =>
            row.userId === participant.userId &&
            row.round.closeAt != null &&
            row.round.closeAt < ranking.startDate!
          )
        : null
      const rankingEnded = ranking.endDate != null && now > ranking.endDate
      // Após o fim da janela, usar somente o acumulado histórico até endDate.
      // Se não há histórico algum, não houve pontuação a incorporar à Mesa:
      // o total no fechamento permanece igual ao baseline.
      const liveTotal = participant.user?.scoreTotal ?? 0
      const scoreTotalCurrent = rankingEnded
        ? latestHistory?.scoreTotal ?? participant.scoreInitial
        : liveTotal
      const score = this.calculateScoreFromBaseline(
        scoreTotalCurrent,
        participant.scoreInitial
      )
      const scoreRound =
        latestHistory?.round.closeAt != null &&
        (!ranking.startDate || latestHistory.round.closeAt >= ranking.startDate)
          ? latestHistory.scoreRound
          : 0
      const hits = RankingTiebreakService.calculateWindowHits(
        latestHistory,
        baselineHistory
      )

      return {
        participantId: participant.id,
        userId: participant.userId,
        score,
        scoreRound,
        position: 0,
        scoreInitial: participant.scoreInitial,
        scoreTotalCurrent,
        ...hits,
        userCreatedAt: participant.user.createdAt,
        previousScore: participant.score,
        previousPosition: participant.position,
      }
    })

    return RankingTiebreakService.rank(rows, row => ({
      userId: row.userId,
      scoreRanking: row.score,
      superDoubleHits: row.superDoubleHits,
      doubleHits: row.doubleHits,
      userCreatedAt: row.userCreatedAt,
    }))
  }
}
