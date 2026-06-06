import { Request, Response } from 'express';
import { OpenRoundService } from '../../services/round/open-round.service';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';

/**
 * Job interno responsável por:
 * - Abrir uma rodada (DRAFT -> OPEN)
 * - Conceder benefícios FREE da rodada
 *
 * ⚠️ Nenhuma regra de negócio aqui
 */
export class OpenRoundJobController {
  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({ error: 'roundId is required' });
      }

      const result = await InternalJobRunnerService.execute({
        jobName: 'OPEN_ROUND',
        referenceId: String(roundId),
        run: async () => {
          await OpenRoundService.execute(roundId);
          return { roundId };
        },
      });

      return res.status(200).json({
        status: 'ok',
        message: 'Round opened and benefits granted',
        roundId,
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
