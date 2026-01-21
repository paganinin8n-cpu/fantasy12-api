import { prisma } from '../../lib/prisma';

export class CloseExpiredRankingsService {
  async execute(): Promise<{ closed: number }> {
    const now = new Date();

    const result = await prisma.ranking.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          not: null,
          lt: now,
        },
      },
      data: {
        status: 'CLOSED',
        updatedAt: now,
      },
    });

    return { closed: result.count };
  }
}
