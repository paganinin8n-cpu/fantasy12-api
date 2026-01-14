import { prisma } from '../../lib/prisma';

export class CloseExpiredRankingsService {
  async execute(): Promise<{ closed: number }> {
    const now = new Date();

    const result = await prisma.ranking.updateMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          lt: now
        }
      },
      data: {
        isActive: false,
        updatedAt: now
      }
    });

    return { closed: result.count };
  }
}
