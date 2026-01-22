import { Router } from 'express';
import jobsRoutes from './jobs.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

// jobs internos (já existentes)
router.use(jobsRoutes);

// webhooks internos
router.use(webhooksRoutes);

export default router;
