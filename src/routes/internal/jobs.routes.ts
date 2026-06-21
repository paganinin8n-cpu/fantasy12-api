import { Router } from 'express';
import { internalJobAuth } from '../../middleware/internal-job-auth.middleware';
import { internalJobRateLimiter } from '../../middleware/rate-limit.middleware';
import { ScoreRoundJobController } from '../../controllers/internal/score-round.job.controller';
import { CloseExpiredRankingsController } from '../../controllers/internal/close-expired-rankings.controller';
import { OpenRoundJobController } from '../../controllers/internal/open-round.job.controller';
import { RecomputeScoredRoundsController } from '../../controllers/internal/recompute-scored-rounds.controller';
import { ScheduledRoundsJobController } from '../../controllers/internal/scheduled-rounds.job.controller';

const router = Router();

const scoreRoundController = new ScoreRoundJobController();
const closeExpiredRankingsController = new CloseExpiredRankingsController();
const openRoundJobController = new OpenRoundJobController();
const recomputeScoredRoundsController = new RecomputeScoredRoundsController();
const scheduledRoundsJobController = new ScheduledRoundsJobController();

/**
 * Apuração de rodada
 * POST /internal/jobs/score-round
 */
router.post(
  '/score-round',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => scoreRoundController.execute(req, res)
);

/**
 * Fechamento de rankings expirados
 * POST /internal/jobs/close-expired-rankings
 */
router.post(
  '/close-expired-rankings',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => closeExpiredRankingsController.execute(req, res)
);

/**
 * Abertura de rodada + grant de benefícios FREE
 * POST /internal/jobs/open-round
 */
router.post(
  '/open-round',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => openRoundJobController.execute(req, res)
);

/**
 * Abertura automatica de rodadas agendadas
 * POST /internal/jobs/open-scheduled-rounds
 */
router.post(
  '/open-scheduled-rounds',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => scheduledRoundsJobController.openScheduled(req, res)
);

/**
 * Fechamento automatico da janela de palpites
 * POST /internal/jobs/close-scheduled-rounds
 */
router.post(
  '/close-scheduled-rounds',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => scheduledRoundsJobController.closeScheduled(req, res)
);

/**
 * Recalculo operacional de rodadas ja apuradas apos mudanca de regra
 * POST /internal/jobs/recompute-scored-rounds
 */
router.post(
  '/recompute-scored-rounds',
  internalJobRateLimiter,
  internalJobAuth,
  (req, res) => recomputeScoredRoundsController.execute(req, res)
);

export default router;
