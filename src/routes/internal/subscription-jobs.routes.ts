import { Router } from 'express';
import { SubscriptionJobsController } from '../../controllers/internal/subscription-jobs.controller';
import { internalJobAuth } from '../../middleware/internal-job-auth.middleware';
import { internalJobRateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

/**
 * EXECUÇÃO INTERNA / CRON
 * POST /internal/jobs/subscriptions/revalidate
 */
router.post(
  '/jobs/subscriptions/revalidate',
  internalJobRateLimiter,
  internalJobAuth,
  SubscriptionJobsController.revalidate
);

export default router;
