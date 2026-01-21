import { Router } from 'express';
import { requireAdmin } from '../middleware/require-admin.middleware';
import { AdminMonetizationController } from '../controllers/admin/monetization.controller';

const router = Router();

router.use(requireAdmin);

router.get('/admin/monetization/wallet/:userId', AdminMonetizationController.wallet);
router.get('/admin/monetization/ledger/:userId', AdminMonetizationController.ledger);
router.get('/admin/monetization/subscriptions/:userId', AdminMonetizationController.subscriptions);
router.post('/admin/monetization/wallet/:userId/credit', AdminMonetizationController.credit);

export default router;
