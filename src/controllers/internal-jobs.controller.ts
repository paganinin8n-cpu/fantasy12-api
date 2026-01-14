import { Request, Response } from 'express';
import { CloseExpiredRankingsService } from '../services/ranking/close-expired-rankings.service';

export class InternalJobsController {
  async closeExpiredRankings(req: Request, res: Response) {
    const service = new CloseExpiredRankingsService();
    const result = await service.execute();

    return res.json({
      success: true,
      closed: result.closed
    });
  }
}
