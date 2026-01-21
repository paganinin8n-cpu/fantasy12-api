import { prisma } from '../../lib/prisma';

type BolaoRankingItem = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
};

export class GetBolaoRankingService {
  static async execute(rankingId: string) {
    /**
     * 1️⃣ Buscar ranking (bolão)
     */
    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        type: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!ranking) {
      throw new Error('Bolão not found');
    }

    if (ranking.type !== 'BOLAO') {
      throw new Error('Ranking is not a bolão');
    }

    if (ranking.status === 'DRAFT') {
      throw new Error('Bolão is not active yet');
    }

    if (!ranking.startDate || !ranking.endDate) {
      throw new Error('Bolão dates are not defined');
    }

    /**
     * 2️⃣ Buscar participantes do bolão
     */
    const participants = await prisma.rankingParticipant.findMany({
      where: { rankingId },
      select: { userId: true },
    });

    if (participants.length === 0) {
      return [];
    }

    const participantIds = participants.map(p => p.userId);

    /**
     * 3️⃣ Buscar snapshots válidos no período do bolão
     */
    const snapshots = await prisma.rankingSnapshot.findMany({
      where: {
        userId: { in: participantIds },
        round: {
          closeAt: {
            gte: ranking.startDate,
            lte: ranking.endDate,
          },
        },
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
     * 4️⃣ Consolidar último snapshot por usuário
     */
    const latestByUser = new Map<string, BolaoRankingItem>();

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
     * 5️⃣ Ordenar ranking (read-only)
     */
    const ordered = Array.from(latestByUser.values()).sort((a, b) => {
      if (b.scoreTotal !== a.scoreTotal) {
        return b.scoreTotal - a.scoreTotal;
      }

      if (b.scoreRound !== a.scoreRound) {
        return b.scoreRound - a.scoreRound;
      }

      return a.userId.localeCompare(b.userId);
    });

    /**
     * 6️⃣ Gerar posições (empate real)
     */
    let position = 1;
    let lastScoreTotal: number | null = null;
    let lastScoreRound: number | null = null;
    let index = 0;

    return ordered.map(item => {
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
