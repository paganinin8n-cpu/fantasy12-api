import { prisma } from '../../lib/prisma';

export class AdminSubscriptionService {
  static async getByUser(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        plan: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    });
  }
}
