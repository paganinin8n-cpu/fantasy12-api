import { RankingTiebreakService } from './ranking-tiebreak.service';

export type RankingCoreRow = {
  userId: string;
  scoreTotal: number;
  scoreRound: number;
  totalDoubles: number;
  totalSuperDoubles: number;
  userCreatedAt: Date;
  position: number;
};

type RankingCoreInput = Omit<RankingCoreRow, 'position'>;

export class RankingCoreService {
  static buildRanking(rows: RankingCoreInput[]): RankingCoreRow[] {
    return RankingTiebreakService.rank(rows, row => ({
      userId: row.userId,
      scoreRanking: row.scoreTotal,
      superDoubleHits: row.totalSuperDoubles,
      doubleHits: row.totalDoubles,
      userCreatedAt: row.userCreatedAt,
    }));
  }
}
