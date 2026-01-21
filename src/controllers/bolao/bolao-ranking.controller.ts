import { Request, Response } from 'express';
import { GetBolaoRankingService } from '../../services/bolao/get-bolao-ranking.service';

export class BolaoRankingController {
  static async handle(req: Request, res: Response) {
    const { rankingId } = req.params;

    if (!rankingId) {
      return res.status(400).json({
        error: 'rankingId is required',
      });
    }

    try {
      const ranking = await GetBolaoRankingService.execute(rankingId);

      return res.json({
        rankingId,
        total: ranking.length,
        ranking,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to load bolão ranking',
      });
    }
  }
}
