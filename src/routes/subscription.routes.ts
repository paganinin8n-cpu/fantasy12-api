import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import { CreateSubscriptionCheckoutSchema } from '../validators/subscription.validator'

const router = Router()

router.get('/api/subscription/plans', authMiddleware, SubscriptionController.plans)
router.get('/api/subscription', authMiddleware, SubscriptionController.get)
router.post(
  '/api/subscription/checkout',
  authMiddleware,
  validateRequest(CreateSubscriptionCheckoutSchema),
  SubscriptionController.checkout
)
router.delete('/api/subscription', authMiddleware, SubscriptionController.cancel)

export default router
