import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { CloseRankingService } from '../../services/ranking/close-ranking.service';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';

export class CloseExpiredRankingsController {
  async execute(req: Request, res: Response) {
    const referenceId = new Date().toISOString().slice(0, 10);

    const result = await InternalJobRunnerService.execute({
      jobName: 'CLOSE_EXPIRED_RANKINGS',
      referenceId,
      run: async () => {
        const expiredRankings = await prisma.ranking.findMany({
          where: {
            status: 'ACTIVE',
            endDate: { not: null, lt: new Date() },
          },
          select: { id: true },
        });

        const service = new CloseRankingService();

        for (const ranking of expiredRankings) {
          await service.execute(ranking.id);
        }

        return {
          closedRankings: expiredRankings.length,
        };
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
