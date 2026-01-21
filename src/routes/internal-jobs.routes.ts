import { Router } from 'express';
import { InternalJobsController } from '../controllers/internal-jobs.controller';
import { ScoreRoundJobController } from '../controllers/internal/score-round.job.controller';
import { GenerateRankingSnapshotController } from '../controllers/internal/generate-ranking-snapshot.controller';
import { internalJobAuth } from '../middleware/internal-job-auth.middleware';

const router = Router();

//
// Controllers
//
const jobsController = new InternalJobsController();
const scoreRoundJobController = new ScoreRoundJobController();

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
// 🔥 JOB — Apuração de rodada (OFICIAL)
// Responsável por:
// - Calcular score dos tickets
// - Gerar UserScoreHistory
// - Marcar rodada como SCORED
//
router.post(
  '/jobs/score-round',
  internalJobAuth,
  (req, res) => scoreRoundJobController.execute(req, res)
);

//
// 🔹 JOB — Snapshot de Ranking v1.2
//
router.post(
  '/jobs/generate-ranking-snapshot',
  internalJobAuth,
  GenerateRankingSnapshotController.handle
);

export default router;
