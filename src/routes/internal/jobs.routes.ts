import { Router } from 'express';
import { internalJobAuth } from '../../middleware/internal-job-auth.middleware';
import { ScoreRoundJobController } from '../../controllers/internal/score-round.job.controller';
import { CloseExpiredRankingsController } from '../../controllers/internal/close-expired-rankings.controller';
import { OpenRoundJobController } from '../../controllers/internal/open-round.job.controller';

const router = Router();

const scoreRoundController = new ScoreRoundJobController();
const closeExpiredRankingsController = new CloseExpiredRankingsController();
const openRoundJobController = new OpenRoundJobController();

/**
 * Apuração de rodada
 * POST /internal/jobs/score-round
 */
router.post(
  '/score-round',
  internalJobAuth,
  (req, res) => scoreRoundController.execute(req, res)
);

/**
 * Fechamento de rankings expirados
 * POST /internal/jobs/close-expired-rankings
 */
router.post(
  '/close-expired-rankings',
  internalJobAuth,
  (req, res) => closeExpiredRankingsController.execute(req, res)
);

/**
 * Abertura de rodada + grant de benefícios FREE
 * POST /internal/jobs/open-round
 */
router.post(
  '/open-round',
  internalJobAuth,
  (req, res) => openRoundJobController.execute(req, res)
);

export default router;
