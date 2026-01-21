import { prisma } from '../../lib/prisma';

type SnapshotRow = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
};

export class SnapshotRankingService {
  static async execute(roundId: string): Promise<void> {
    /**
     * 1️⃣ Validar rodada
     */
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { id: true, status: true },
    });

    if (!round) {
      throw new Error('Round not found');
    }

    if (round.status !== 'SCORED') {
      throw new Error('Snapshot can only be generated for SCORED rounds');
    }

    /**
     * 2️⃣ Garantir idempotência
     * (snapshot nunca pode ser gerado duas vezes)
     */
    const snapshotExists = await prisma.rankingSnapshot.findFirst({
      where: { roundId },
      select: { id: true },
    });

    if (snapshotExists) {
      throw new Error('Snapshot already generated for this round');
    }

    /**
     * 3️⃣ Buscar score acumulado por usuário ATÉ esta rodada
     */
    const history = await prisma.userScoreHistory.groupBy({
      by: ['userId'],
      where: {
        roundId: {
          lte: roundId,
        },
      },
      _max: {
        scoreTotal: true,
      },
    });

    if (history.length === 0) {
      return;
    }

    /**
     * 4️⃣ Buscar score da rodada atual (para desempate)
     */
    const roundScores = await prisma.userScoreHistory.findMany({
      where: { roundId },
      select: {
        userId: true,
        scoreRound: true,
      },
    });

    const roundScoreMap = new Map<string, number>();
    roundScores.forEach(r => {
      roundScoreMap.set(r.userId, r.scoreRound);
    });

    /**
     * 5️⃣ Normalizar dados
     */
    const rows: SnapshotRow[] = history.map(h => ({
      userId: h.userId,
      scoreTotal: h._max.scoreTotal ?? 0,
      scoreRound: roundScoreMap.get(h.userId) ?? 0,
    }));

    /**
     * 6️⃣ Ordenação + desempates (CONGELADO)
     */
    rows.sort((a, b) => {
      if (b.scoreTotal !== a.scoreTotal) {
        return b.scoreTotal - a.scoreTotal;
      }

      if (b.scoreRound !== a.scoreRound) {
        return b.scoreRound - a.scoreRound;
      }

      return a.userId.localeCompare(b.userId);
    });

    /**
     * 7️⃣ Calcular posições (empate real)
     */
    let currentPosition = 1;
    let lastScoreTotal: number | null = null;
    let lastScoreRound: number | null = null;
    let index = 0;

    const snapshots = rows.map(row => {
      index++;

      if (
        lastScoreTotal !== null &&
        (row.scoreTotal !== lastScoreTotal ||
          row.scoreRound !== lastScoreRound)
      ) {
        currentPosition = index;
      }

      lastScoreTotal = row.scoreTotal;
      lastScoreRound = row.scoreRound;

      return {
        roundId,
        userId: row.userId,
        scoreTotal: row.scoreTotal,
        scoreRound: row.scoreRound,
        position: currentPosition,
        snapshotType: 'GLOBAL',
        periodRef: null,
      };
    });

    /**
     * 8️⃣ Persistir snapshot (INSERT ONLY)
     */
    await prisma.rankingSnapshot.createMany({
      data: snapshots,
    });
  }
}
