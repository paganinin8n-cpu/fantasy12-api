import { Request, Response } from 'express';
import { GetSemesterRankingService } from '../../services/ranking/get-semester-ranking.service';

export class SemesterRankingController {
  static async handle(req: Request, res: Response) {
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      return res.status(400).json({
        error: 'Query param "period" is required (YYYY-S1 or YYYY-S2)',
      });
    }

    try {
      const ranking = await GetSemesterRankingService.execute(period);

      return res.json({
        period,
        total: ranking.length,
        ranking,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to load semester ranking',
      });
    }
  }
}
