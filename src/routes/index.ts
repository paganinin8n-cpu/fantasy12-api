import { Router } from 'express';
import internalRoutes from './internal';
import walletRoutes from './wallet.routes';

const router = Router();

router.use('/internal', internalRoutes);
router.use(walletRoutes);

export default router;
