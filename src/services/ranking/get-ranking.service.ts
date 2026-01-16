import { prisma } from '../../lib/prisma';
import { RankingRepository } from '../../repositories/ranking.repository';

export class GetRankingService {
  private rankingRepo = new RankingRepository();

  async execute(rankingId: string) {
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        startDate: true,
        endDate: true,
        createdAt: true
      }
    });

    if (!ranking) {
      throw new Error('Ranking não encontrado');
    }

    const participants = await this.rankingRepo.listByRankingId(rankingId);

    // ✅ DTO PLANO — SEM PRISMA OBJECT
    return {
      id: ranking.id,
      name: ranking.name,
      type: ranking.type,
      isActive: ranking.isActive,
      startDate: ranking.startDate,
      endDate: ranking.endDate,
      createdAt: ranking.createdAt,
      participants
    };
  }
}
