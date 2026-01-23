import { Router } from 'express';
import { SubscriptionJobsController } from '../../controllers/internal/subscription-jobs.controller';

const router = Router();

/**
 * EXECUÇÃO INTERNA / CRON
 * POST /internal/jobs/subscriptions/revalidate
 */
router.post(
  '/jobs/subscriptions/revalidate',
  SubscriptionJobsController.revalidate
);

export default router;
