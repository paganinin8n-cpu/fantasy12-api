import { Request, Response } from 'express';
import { GetWeeklyRankingService } from '../../services/ranking/get-weekly-ranking.service';

export class WeeklyRankingController {
  static async handle(req: Request, res: Response) {
    const { period } = req.query;

    if (!period || typeof period !== 'string') {
      return res.status(400).json({
        error: 'Query param "period" is required (YYYY-WW)',
      });
    }

    try {
      const ranking = await GetWeeklyRankingService.execute(period);

      return res.json({
        period,
        total: ranking.length,
        ranking,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to load weekly ranking',
      });
    }
  }
}
