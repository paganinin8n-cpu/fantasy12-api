import { Request, Response } from 'express';
import { ScoreRoundService } from '../../services/score/score-round.service';

const INTERNAL_JOB_SECRET = process.env.INTERNAL_JOB_SECRET;

export class ScoreRoundJobController {
  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const token = req.headers['x-internal-job-token'];

      if (!INTERNAL_JOB_SECRET || token !== INTERNAL_JOB_SECRET) {
        return res.status(401).json({
          error: 'Unauthorized internal job',
        });
      }

      const { roundId } = req.body;

      if (!roundId) {
        return res.status(400).json({
          error: 'roundId is required',
        });
      }

      const service = new ScoreRoundService();
      await service.execute(roundId);

      return res.status(200).json({
        status: 'ok',
        message: 'Round scored successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      });
    }
  }
}
