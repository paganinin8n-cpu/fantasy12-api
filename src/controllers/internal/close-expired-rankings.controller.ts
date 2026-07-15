import { Request, Response } from 'express'
import { CloseExpiredRankingsJobService } from '../../services/jobs/close-expired-rankings.job.service'

export class CloseExpiredRankingsController {
  async execute(_req: Request, res: Response) {
    const result = await CloseExpiredRankingsJobService.execute()

    return res.json({
      closedRankings: result.closedRankings,
      execution: result.execution,
    })
  }
}
