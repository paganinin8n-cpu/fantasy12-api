import { prisma } from '../lib/prisma';

export class RankingRepository {

  async listByRankingId(rankingId: string) {
    return prisma.rankingParticipant.findMany({
      where: { rankingId },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' } // fallback determinístico para evitar sort instável
      ],
      select: {
        position: true,
        score: true,
        scoreInitial: true,
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profileImage: true
          }
        }
      }
    });
  }

}
