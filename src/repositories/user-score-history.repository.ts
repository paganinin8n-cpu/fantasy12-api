import { prisma } from '../lib/prisma';

export class UserScoreHistoryRepository {
  async findLastByUser(userId: string) {
    return prisma.userScoreHistory.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data: {
    userId: string;
    roundId: string;
    scoreRound: number;
    scoreTotal: number;
  }) {
    return prisma.userScoreHistory.create({ data });
  }
}