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
}

export class RankingWindowScoreService {
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
      where: { rankingId: ranking.id },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (!ranking.startDate || participants.length === 0) {
      return participants.map((participant, index) => ({
        participantId: participant.id,
        userId: participant.userId,
        score: 0,
        scoreRound: 0,
        position: index + 1,
      }))
    }

    const participantIds = participants.map(participant => participant.userId)
    const endDate = ranking.endDate ?? new Date()

    const scoreRows = await tx.userScoreHistory.groupBy({
      by: ['userId'],
      where: {
        userId: { in: participantIds },
        round: {
          closeAt: {
            gte: ranking.startDate,
            lte: endDate,
          },
        },
      },
      _sum: {
        scoreRound: true,
      },
    })

    const latestRows = await tx.userScoreHistory.findMany({
      where: {
        userId: { in: participantIds },
        round: {
          closeAt: {
            gte: ranking.startDate,
            lte: endDate,
          },
        },
      },
      select: {
        userId: true,
        scoreRound: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const scoreByUser = new Map(
      scoreRows.map(row => [row.userId, row._sum.scoreRound ?? 0])
    )

    const scoreRoundByUser = new Map<string, number>()
    for (const row of latestRows) {
      if (!scoreRoundByUser.has(row.userId)) {
        scoreRoundByUser.set(row.userId, row.scoreRound)
      }
    }

    const participantOrder = new Map(
      participants.map((participant, index) => [participant.userId, index])
    )

    const rows = participants.map(participant => ({
      participantId: participant.id,
      userId: participant.userId,
      score: scoreByUser.get(participant.userId) ?? 0,
      scoreRound: scoreRoundByUser.get(participant.userId) ?? 0,
      position: 0,
    }))

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
