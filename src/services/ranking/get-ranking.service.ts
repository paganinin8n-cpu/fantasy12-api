import { prisma } from '../../lib/prisma'
import { RankingRepository } from '../../repositories/ranking.repository'

export class GetRankingService {
  private rankingRepo = new RankingRepository()

  async execute(rankingId: string) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      },
    })

    /**
     * ⚠️ CONTRATO IMPORTANTE
     * Ausência de ranking NÃO é erro técnico
     * Deve retornar payload controlado
     */
    if (!ranking) {
      return {
        ranking: null,
        participants: [],
      }
    }

    const participants = await this.rankingRepo.listByRankingId(rankingId)

    return {
      ranking: {
        id: ranking.id,
        name: ranking.name,
        type: ranking.type,
        status: ranking.status,
        startDate: ranking.startDate,
        endDate: ranking.endDate,
        createdAt: ranking.createdAt,
      },
      participants,
    }
  }
}
