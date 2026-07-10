import { Prisma } from '@prisma/client'

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
  previousScore: number
  previousPosition: number | null
}

export class RankingWindowScoreService {
  static calculateScoreFromBaseline(
    scoreTotalCurrent: number,
    scoreInitial: number
  ) {
    return Math.max(0, scoreTotalCurrent - scoreInitial)
  }

  static async getScoreTotalBefore(
    tx: RankingScoreClient,
    userId: string,
    date: Date
  ) {
    const history = await tx.userScoreHistory.findFirst({
      where: {
        userId,
        round: {
          closeAt: {
            lt: date,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        scoreTotal: true,
      },
    })

    return history?.scoreTotal ?? 0
  }

  static async buildRows(
    tx: RankingScoreClient,
    ranking: RankingWindow
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
            ...(ranking.startDate ? { gte: ranking.startDate } : {}),
            lte: endDate,
          },
        },
      },
      select: {
        userId: true,
        scoreTotal: true,
        scoreRound: true,
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

    const participantOrder = new Map(
      participants.map((participant, index) => [participant.userId, index])
    )

    const rows = participants.map(participant => {
      const admissionDate = participant.approvedAt ?? participant.createdAt
      const effectiveStart =
        ranking.startDate && ranking.startDate > admissionDate
          ? ranking.startDate
          : admissionDate
      const eligibleHistory = historyRows.filter(row =>
        row.userId === participant.userId &&
        row.round.closeAt != null &&
        row.round.closeAt >= effectiveStart &&
        row.round.closeAt <= endDate
      )
      const score = Math.max(
        0,
        eligibleHistory.reduce((total, row) => total + row.scoreRound, 0)
      )
      const latestHistory = eligibleHistory[0]
      const scoreTotalCurrent = latestHistory?.scoreTotal ?? participant.scoreInitial

      return {
        participantId: participant.id,
        userId: participant.userId,
        score,
        scoreRound: latestHistory?.scoreRound ?? 0,
        position: 0,
        scoreInitial: participant.scoreInitial,
        scoreTotalCurrent,
        previousScore: participant.score,
        previousPosition: participant.position,
      }
    })

    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.scoreRound !== a.scoreRound) return b.scoreRound - a.scoreRound
      return (participantOrder.get(a.userId) ?? 0) - (participantOrder.get(b.userId) ?? 0)
    })

    let currentPosition = 1
    let lastScore: number | null = null
    let lastScoreRound: number | null = null

    return rows.map((row, index) => {
      if (
        lastScore !== null &&
        (row.score !== lastScore || row.scoreRound !== lastScoreRound)
      ) {
        currentPosition = index + 1
      }

      lastScore = row.score
      lastScoreRound = row.scoreRound

      return {
        ...row,
        position: currentPosition,
      }
    })
  }
}
