import { Router } from 'express';
import { InternalJobsController } from '../controllers/internal-jobs.controller';
import { internalJobAuth } from '../middleware/internalJobAuth';

const router = Router();
const controller = new InternalJobsController();

router.post(
  '/jobs/close-expired-rankings',
  internalJobAuth,
  controller.closeExpiredRankings.bind(controller)
);

export default router;
