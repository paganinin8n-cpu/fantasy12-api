import { prisma } from '../../lib/prisma'
import { RankingWindowScoreService } from '../ranking/ranking-window-score.service'

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
        entryFee: true,
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
      throw new Error('Mesa não encontrada')
    }

    if (ranking.type !== 'BOLAO') {
      throw new Error('Ranking não é uma Mesa')
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

    const liveRows = await RankingWindowScoreService.buildRows(prisma, ranking)
    const liveRowByUser = new Map(liveRows.map(row => [row.userId, row]))
    const liveOrderByUser = new Map(
      liveRows.map((row, index) => [row.userId, index])
    )

    const orderedParticipants = [...participants].sort((a, b) => {
      return (
        (liveOrderByUser.get(a.userId) ?? Number.MAX_SAFE_INTEGER) -
        (liveOrderByUser.get(b.userId) ?? Number.MAX_SAFE_INTEGER)
      )
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
        scoreTotal: liveRowByUser.get(participant.userId)?.score ?? participant.score,
        scoreRound: liveRowByUser.get(participant.userId)?.scoreRound ?? 0,
        position: liveRowByUser.get(participant.userId)?.position ?? index + 1,
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
        entryFee: ranking.entryFee,
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
