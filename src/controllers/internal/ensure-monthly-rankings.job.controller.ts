import { Request, Response } from 'express'
import { EnsureMonthlyRankingsJobService } from '../../services/jobs/ensure-monthly-rankings.job.service'

export class EnsureMonthlyRankingsJobController {
  async execute(req: Request, res: Response) {
    try {
      const periodRef =
        typeof req.body?.periodRef === 'string' ? req.body.periodRef : undefined

      const result = await EnsureMonthlyRankingsJobService.execute({
        periodRef,
        source: 'manual',
      })

      return res.status(200).json({
        status: 'ok',
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      })
    }
  }
}
