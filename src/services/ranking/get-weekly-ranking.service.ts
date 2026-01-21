import { prisma } from '../../lib/prisma';

type WeeklyRankingItem = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
};

export class GetWeeklyRankingService {
  static async execute(periodRef: string) {
    /**
     * 1️⃣ Validar período (YYYY-WW)
     */
    if (!/^\d{4}-\d{2}$/.test(periodRef)) {
      throw new Error('Invalid period format. Expected YYYY-WW');
    }

    /**
     * 2️⃣ Buscar snapshots da semana (read-only)
     */
    const snapshots = await prisma.rankingSnapshot.findMany({
      where: {
        snapshotType: 'WEEKLY',
        periodRef,
      },
      select: {
        userId: true,
        scoreTotal: true,
        scoreRound: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (snapshots.length === 0) {
      return [];
    }

    /**
     * 3️⃣ Consolidar último snapshot da semana por usuário
     */
    const latestByUser = new Map<string, WeeklyRankingItem>();

    for (const snap of snapshots) {
      if (!latestByUser.has(snap.userId)) {
        latestByUser.set(snap.userId, {
          userId: snap.userId,
          scoreTotal: snap.scoreTotal,
          scoreRound: snap.scoreRound,
        });
      }
    }

    /**
     * 4️⃣ Ordenação final (read-only)
     */
    const ranking = Array.from(latestByUser.values()).sort((a, b) => {
      if (b.scoreTotal !== a.scoreTotal) {
        return b.scoreTotal - a.scoreTotal;
      }

      if (b.scoreRound !== a.scoreRound) {
        return b.scoreRound - a.scoreRound;
      }

      return a.userId.localeCompare(b.userId);
    });

    /**
     * 5️⃣ Calcular posições (empate real)
     */
    let position = 1;
    let lastScoreTotal: number | null = null;
    let lastScoreRound: number | null = null;
    let index = 0;

    return ranking.map(item => {
      index++;

      if (
        lastScoreTotal !== null &&
        (item.scoreTotal !== lastScoreTotal ||
          item.scoreRound !== lastScoreRound)
      ) {
        position = index;
      }

      lastScoreTotal = item.scoreTotal;
      lastScoreRound = item.scoreRound;

      return {
        ...item,
        position,
      };
    });
  }
}
