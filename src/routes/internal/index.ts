import { Router } from 'express';
import jobsRoutes from './jobs.routes';

const router = Router();

router.use(jobsRoutes);

export default router;
