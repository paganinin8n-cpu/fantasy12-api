import { Request, Response } from 'express';
import { GetMonthlyRankingService } from '../../services/ranking/get-monthly-ranking.service';

export class MonthlyRankingController {
  static async handle(req: Request, res: Response) {
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      return res.status(400).json({
        error: 'Query param "period" is required (YYYY-MM)',
      });
    }

    try {
      const ranking = await GetMonthlyRankingService.execute(period);

      return res.json({
        period,
        total: ranking.length,
        ranking,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to load monthly ranking',
      });
    }
  }
}
