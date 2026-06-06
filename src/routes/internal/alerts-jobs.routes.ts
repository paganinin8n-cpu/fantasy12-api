import { Router } from 'express';
import { AlertsJobsController } from '../../controllers/internal/alerts-jobs.controller';
import { internalJobAuth } from '../../middleware/internal-job-auth.middleware';

const router = Router();

router.post(
  '/jobs/alerts/run',
  internalJobAuth,
  AlertsJobsController.run
);

export default router;
