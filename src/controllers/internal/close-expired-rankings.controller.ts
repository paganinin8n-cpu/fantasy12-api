import { Request, Response } from 'express';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';
import { CloseExpiredRankingsService } from '../../services/ranking/close-expired-rankings.service';

export class CloseExpiredRankingsController {
  async execute(req: Request, res: Response) {
    const referenceId = new Date().toISOString().slice(0, 10);

    const result = await InternalJobRunnerService.execute({
      jobName: 'CLOSE_EXPIRED_RANKINGS',
      referenceId,
      run: async () => {
        const result = await new CloseExpiredRankingsService().execute();
        return { closedRankings: result.closed };
      },
    });

    return res.json({
      closedRankings: result.result?.closedRankings ?? 0,
      execution: {
        id: result.executionId,
        status: result.status,
      },
    });
  }
}
