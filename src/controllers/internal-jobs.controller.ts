import { Router } from 'express';
import { InternalJobsController } from '../controllers/internal-jobs.controller';
import { internalJobAuth } from '../middleware/internalJobAuth';

const router = Router();
const controller = new InternalJobsController();

/**
 * ======================
 * INTERNAL JOBS
 * ======================
 * Uso exclusivo de infraestrutura / cron
 */
router.post(
  '/jobs/close-expired-rankings',
  internalJobAuth,
  controller.closeExpiredRankings
);

export default router;
