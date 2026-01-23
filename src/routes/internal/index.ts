import { Router } from 'express';
import mercadoPagoRoutes from './mercado-pago.routes';
import subscriptionJobsRoutes from './subscription-jobs.routes';

const router = Router();

router.use(mercadoPagoRoutes);
router.use(subscriptionJobsRoutes);

export default router;
