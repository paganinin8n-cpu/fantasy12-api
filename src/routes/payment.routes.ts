import { Router } from 'express'
import { PaymentController } from '../controllers/payment.controller'
import { PaymentPackagesController } from '../controllers/payment-packages.controller'
import { PaymentsHistoryController } from '../controllers/PaymentsHistoryController'
import { validateRequest } from '../middleware/validate-request.middleware'
import { CreatePaymentSchema } from '../validators/payment.validator'
import { paymentRateLimiter } from '../middleware/rate-limit.middleware'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.post(
  '/payments',
  paymentRateLimiter,
  authMiddleware,
  validateRequest(CreatePaymentSchema),
  PaymentController.handle
)
router.get('/payment-packages', PaymentPackagesController.handle)
router.get('/payments/history', authMiddleware, PaymentsHistoryController.handle)

export default router
