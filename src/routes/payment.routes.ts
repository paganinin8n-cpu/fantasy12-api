import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
router.post('/payments', PaymentController.create);

export default router;
