import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import PaymentPackagesController from '../controllers/payment-packages.controller';
import PaymentsHistoryController from '../controllers/PaymentsHistoryController';

const router = Router();

router.post('/api/payments', PaymentController.create);
router.get('/api/payment-packages', PaymentPackagesController.list);
router.get('/api/payments/history', PaymentsHistoryController.history);

export default router;
