import { prisma } from '../../lib/prisma'

type ExecuteInput = {
  rankingId: string
  viewerUserId?: string
}

export class GetBolaoRankingService {
  static async execute({ rankingId, viewerUserId }: ExecuteInput) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        maxParticipants: true,
        currentParticipants: true,
        createdByUserId: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
    })

    if (!ranking) {
      throw new Error('Bolão not found')
    }

    if (ranking.type !== 'BOLAO') {
      throw new Error('Ranking is not a bolão')
    }

    const participants = await prisma.rankingParticipant.findMany({
      where: { rankingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { score: 'desc' }, { createdAt: 'asc' }],
    })

    const participantIds = participants.map(participant => participant.userId)
    const latestSnapshots =
      participantIds.length > 0
        ? await prisma.rankingSnapshot.findMany({
            where: {
              userId: { in: participantIds },
              ...(ranking.startDate && ranking.endDate
                ? {
                    round: {
                      closeAt: {
                        gte: ranking.startDate,
                        lte: ranking.endDate,
                      },
                    },
                  }
                : {}),
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
        : []

    const lastRoundByUser = new Map<string, number>()
    for (const snapshot of latestSnapshots) {
      if (!lastRoundByUser.has(snapshot.userId)) {
        lastRoundByUser.set(snapshot.userId, snapshot.scoreRound)
      }
    }

    const orderedParticipants = [...participants].sort((a, b) => {
      const aPosition = a.position ?? Number.MAX_SAFE_INTEGER
      const bPosition = b.position ?? Number.MAX_SAFE_INTEGER

      if (aPosition !== bPosition) {
        return aPosition - bPosition
      }

      if (b.score !== a.score) {
        return b.score - a.score
      }

      return a.userId.localeCompare(b.userId)
    })

    const rankingItems = orderedParticipants.map((participant, index) => {
      const displayName =
        participant.user.nickname?.trim() ||
        participant.user.name?.trim() ||
        participant.user.email

      return {
        userId: participant.userId,
        name: displayName,
        isOwner: participant.userId === ranking.createdByUserId,
        isMe: participant.userId === viewerUserId,
        scoreTotal: participant.score,
        scoreRound: lastRoundByUser.get(participant.userId) ?? 0,
        position: participant.position ?? index + 1,
      }
    })

    const me =
      viewerUserId != null
        ? rankingItems.find(item => item.userId === viewerUserId) ?? null
        : null

    const ownerName =
      ranking.createdBy?.nickname?.trim() ||
      ranking.createdBy?.name?.trim() ||
      ranking.createdBy?.email ||
      'Administrador'

    return {
      ranking: {
        id: ranking.id,
        name: ranking.name,
        description: ranking.description,
        status: ranking.status,
        startDate: ranking.startDate,
        endDate: ranking.endDate,
        participants: ranking.currentParticipants,
        maxParticipants: ranking.maxParticipants,
        ownerName,
        isOwner: ranking.createdByUserId === viewerUserId,
        joined: rankingItems.some(item => item.userId === viewerUserId),
      },
      total: rankingItems.length,
      me,
      entries: rankingItems,
    }
  }
}
