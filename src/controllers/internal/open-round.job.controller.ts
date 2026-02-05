import { Request, Response } from 'express';
import { OpenRoundService } from '../../services/round/open-round.service';

const INTERNAL_JOB_SECRET = process.env.INTERNAL_JOB_SECRET;

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
      const token = req.headers['x-internal-job-token'];

      if (!INTERNAL_JOB_SECRET || token !== INTERNAL_JOB_SECRET) {
        return res.status(401).json({ error: 'Unauthorized internal job' });
      }

      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({ error: 'roundId is required' });
      }

      await OpenRoundService.execute(roundId);

      return res.status(200).json({
        status: 'ok',
        message: 'Round opened and benefits granted',
        roundId,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      });
    }
  }
}
