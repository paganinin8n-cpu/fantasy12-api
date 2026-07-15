import { prisma } from '../../lib/prisma'
import { RankingType } from '@prisma/client'

/**
 * Lista todas as Mesas em que o usuário participa, junto com sua posição
 * atual e o total de participantes.
 *
 * Mesas só são consideradas aquelas com `type === BOLAO`.
 */
export class ListUserBoloesService {
  static async execute({ userId }: { userId: string }) {
    const participations = await prisma.rankingParticipant.findMany({
      where: {
        userId,
        status: 'APPROVED',
        ranking: { type: RankingType.BOLAO },
      },
      include: {
        ranking: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            entryFee: true,
            prizeDistribution: true,
            grossCollected: true,
            platformFee: true,
            prizePool: true,
            settledAt: true,
            startDate: true,
            endDate: true,
            currentParticipants: true,
            maxParticipants: true,
            createdByUserId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return participations.map(p => ({
      id: p.ranking.id,
      name: p.ranking.name,
      description: p.ranking.description,
      status: p.ranking.status,
      entryFee: p.ranking.entryFee,
      prizeDistribution: p.ranking.prizeDistribution,
      grossCollected: p.ranking.grossCollected,
      platformFee: p.ranking.platformFee,
      prizePool: p.ranking.prizePool,
      settledAt: p.ranking.settledAt,
      startDate: p.ranking.startDate,
      endDate: p.ranking.endDate,
      participants: p.ranking.currentParticipants,
      maxParticipants: p.ranking.maxParticipants,
      isOwner: p.ranking.createdByUserId === userId,
      myPosition: p.position,
      myScore: p.score,
    }))
  }
}
