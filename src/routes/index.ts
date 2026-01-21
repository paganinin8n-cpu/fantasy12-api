import { Router } from 'express';
import internalRoutes from './internal.routes';
// outras rotas já existentes continuam aqui

const router = Router();

// rotas públicas existentes
// router.use('/auth', authRoutes);
// router.use('/rankings', rankingRoutes);

// rotas internas
router.use('/internal', internalRoutes);

export default router;
