import { Request, Response } from 'express';
import { GetRankingService } from '../services/ranking/get-ranking.service';

export class RankingController {

  async show(req: Request, res: Response) {
    const { rankingId } = req.params;

    const service = new GetRankingService();
    const ranking = await service.execute(rankingId);

    return res.json(ranking);
  }
}
