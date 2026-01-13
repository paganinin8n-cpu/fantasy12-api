import { RankingRepository } from '../../repositories/ranking.repository';

export class GetRankingService {
  private rankingRepo = new RankingRepository();

  async execute(rankingId: string) {
    return this.rankingRepo.listByRankingId(rankingId);
  }
}
