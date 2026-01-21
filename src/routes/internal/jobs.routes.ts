import { Router } from 'express';
import { internalJobAuth } from '../../middleware/internal-job-auth.middleware';
import { ScoreRoundJobController } from '../../controllers/internal/score-round.job.controller';
import { CloseExpiredRankingsController } from '../../controllers/internal/close-expired-rankings.controller';

const router = Router();

const scoreRoundController = new ScoreRoundJobController();
const closeExpiredRankingsController = new CloseExpiredRankingsController();

router.post(
  '/score-round',
  internalJobAuth,
  (req, res) => scoreRoundController.execute(req, res)
);

router.post(
  '/close-expired-rankings',
  internalJobAuth,
  (req, res) => closeExpiredRankingsController.execute(req, res)
);

export default router;
