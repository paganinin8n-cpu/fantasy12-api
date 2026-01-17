import { Router } from 'express';
import { ScoreRoundJobController } from '../controllers/internal/score-round.job.controller';

const internalRoutes = Router();
const scoreRoundJobController = new ScoreRoundJobController();

internalRoutes.post(
  '/jobs/score-round',
  (req, res) => scoreRoundJobController.execute(req, res)
);

export { internalRoutes };
