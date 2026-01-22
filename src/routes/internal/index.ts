import { Router } from 'express';
import jobsRoutes from './jobs.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

/**
 * ⚙️ JOBS INTERNOS
 */
router.use(jobsRoutes);

/**
 * 🔔 WEBHOOKS EXTERNOS (Mercado Pago)
 */
router.use(webhooksRoutes);

export default router;
