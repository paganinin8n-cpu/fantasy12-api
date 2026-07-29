import { prisma } from '../../lib/prisma';
import { RankingTiebreakService } from './ranking-tiebreak.service';

type MonthlyRankingItem = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
  totalDoubles: number;
  totalSuperDoubles: number;
  userCreatedAt: Date;
};

export class GetMonthlyRankingService {
  static async execute(periodRef: string) {
    /**
     * 1️⃣ Validar período (YYYY-MM)
     */
    if (!/^\d{4}-\d{2}$/.test(periodRef)) {
      throw new Error('Invalid period format. Expected YYYY-MM');
    }

    /**
     * 2️⃣ Buscar snapshots do período
     * Apenas GLOBAL, apenas leitura
     */
    const snapshots = await prisma.rankingSnapshot.findMany({
      where: {
        snapshotType: 'GLOBAL',
        periodRef,
      },
      select: {
        userId: true,
        scoreTotal: true,
        scoreRound: true,
        totalDoubles: true,
        totalSuperDoubles: true,
        createdAt: true,
        user: {
          select: { createdAt: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (snapshots.length === 0) {
      return [];
    }

    /**
     * 3️⃣ Consolidar último snapshot do período por usuário
     */
    const latestByUser = new Map<string, MonthlyRankingItem>();

    for (const snap of snapshots) {
      if (!latestByUser.has(snap.userId)) {
        latestByUser.set(snap.userId, {
          userId: snap.userId,
          scoreTotal: snap.scoreTotal,
          scoreRound: snap.scoreRound,
          totalDoubles: snap.totalDoubles,
          totalSuperDoubles: snap.totalSuperDoubles,
          userCreatedAt: snap.user.createdAt,
        });
      }
    }

    /**
     * 4️⃣ Ordenação final (read-only)
     */
    return RankingTiebreakService.rank(
      Array.from(latestByUser.values()),
      item => ({
        userId: item.userId,
        scoreRanking: item.scoreTotal,
        superDoubleHits: item.totalSuperDoubles,
        doubleHits: item.totalDoubles,
        userCreatedAt: item.userCreatedAt,
      })
    );
  }
}
