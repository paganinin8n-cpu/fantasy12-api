import { Router } from 'express';
import { InternalJobsController } from '../controllers/internal-jobs.controller';
import { internalJobAuth } from '../middleware/internalJobAuth';

const router = Router();

router.post(
  '/jobs/close-expired-rankings',
  internalJobAuth,
  InternalJobsController.closeExpiredRankings
);

export default router;
