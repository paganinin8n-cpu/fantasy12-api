import { Prisma } from '@prisma/client';

export type RankingCoreRow = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
  position: number;
};

export class RankingCoreService {
  /**
   * Aplica ordenação oficial congelada
   */
  static sortRows(rows: {
    userId: string;
    scoreTotal: number;
    scoreRound: number;
  }[]) {
    rows.sort((a, b) => {
      if (b.scoreTotal !== a.scoreTotal) {
        return b.scoreTotal - a.scoreTotal;
      }

      if (b.scoreRound !== a.scoreRound) {
        return b.scoreRound - a.scoreRound;
      }

      return a.userId.localeCompare(b.userId);
    });

    return rows;
  }

  /**
   * Calcula posições com empate real
   */
  static applyPositions(rows: {
    userId: string;
    scoreTotal: number;
    scoreRound: number;
  }[]): RankingCoreRow[] {
    let currentPosition = 1;
    let lastScoreTotal: number | null = null;
    let lastScoreRound: number | null = null;
    let index = 0;

    return rows.map(row => {
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
        ...row,
        position: currentPosition,
      };
    });
  }

  /**
   * Pipeline completo
   */
  static buildRanking(rows: {
    userId: string;
    scoreTotal: number;
    scoreRound: number;
  }[]): RankingCoreRow[] {
    const sorted = this.sortRows(rows);
    return this.applyPositions(sorted);
  }
}
