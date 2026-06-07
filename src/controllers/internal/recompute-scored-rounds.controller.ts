import { Request, Response } from 'express'
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service'
import { RecomputeScoredRoundsService } from '../../services/score/recompute-scored-rounds.service'

export class RecomputeScoredRoundsController {
  async execute(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await InternalJobRunnerService.execute({
        jobName: 'RECOMPUTE_SCORED_ROUNDS',
        referenceId: new Date().toISOString().slice(0, 10),
        run: async () => RecomputeScoredRoundsService.execute(),
      })

      return res.status(200).json({
        status: 'ok',
        message: 'Scored rounds recomputed successfully',
        execution: {
          id: result.executionId,
          status: result.status,
          result: result.result,
        },
      })
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      })
    }
  }
}
