import { RankingType } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AssertActiveProUserService } from '../subscription/assert-active-pro-user.service'

export class ListAvailableBoloesService {
  static async execute({ userId }: { userId: string }) {
    await AssertActiveProUserService.execute(userId)

    const participations = await prisma.rankingParticipant.findMany({
      where: {
        userId,
        ranking: { type: RankingType.BOLAO },
      },
      select: {
        rankingId: true,
      },
    })

    const joinedRankingIds = participations.map(item => item.rankingId)

    const boloes = await prisma.ranking.findMany({
      where: {
        type: RankingType.BOLAO,
        status: 'DRAFT',
        NOT: {
          id: { in: joinedRankingIds.length ? joinedRankingIds : ['__none__'] },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        currentParticipants: true,
        maxParticipants: true,
        createdByUserId: true,
        createdBy: {
          select: {
            name: true,
            nickname: true,
          },
        },
      },
      orderBy: [{ currentParticipants: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    })

    return boloes.map(bolao => ({
      id: bolao.id,
      name: bolao.name,
      description: bolao.description,
      status: bolao.status,
      participants: bolao.currentParticipants,
      maxParticipants: bolao.maxParticipants,
      isOwner: bolao.createdByUserId === userId,
      ownerName:
        bolao.createdBy?.nickname?.trim() ||
        bolao.createdBy?.name?.trim() ||
        'Anfitrião Fantasy12',
    }))
  }
}
