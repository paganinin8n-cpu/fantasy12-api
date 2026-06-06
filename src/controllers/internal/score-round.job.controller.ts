import { Request, Response } from 'express';
import { ScoreRoundService } from '../../services/score/score-round.service';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';

export class ScoreRoundJobController {
  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          error: 'roundId is required',
        });
      }

      const result = await InternalJobRunnerService.execute({
        jobName: 'SCORE_ROUND',
        referenceId: String(roundId),
        run: async () => {
          const service = new ScoreRoundService();
          await service.execute(roundId);
          return { roundId };
        },
      });

      return res.status(200).json({
        status: 'ok',
        message: 'Round scored successfully',
        execution: {
          id: result.executionId,
          status: result.status,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      });
    }
  }
}
