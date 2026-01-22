import { Router } from 'express';
import jobsRoutes from './jobs.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

router.use(jobsRoutes);
router.use(webhooksRoutes);

export default router;
