import { Router } from 'express';
import { InternalJobsController } from '../controllers/internal-jobs.controller';
import { InternalScoreController } from '../controllers/internal-score.controller';
import { internalJobAuth } from '../middleware/internalJobAuth';

const router = Router();

//
 // Controllers
 //
const jobsController = new InternalJobsController();
const scoreController = new InternalScoreController();

//
 // 🔒 JOB — Fechar rankings expirados
 // Uso interno (cron / scheduler)
 //
router.post(
  '/jobs/close-expired-rankings',
  internalJobAuth,
  jobsController.closeExpiredRankings.bind(jobsController)
);

//
 // 🔥 JOB — Apuração de rodada
 // Responsável por:
 // - Calcular score dos tickets
 // - Gerar UserScoreHistory
 // - Marcar rodada como SCORED
 //
router.post(
  '/jobs/score-round',
  internalJobAuth,
  scoreController.scoreRound.bind(scoreController)
);

export default router;
