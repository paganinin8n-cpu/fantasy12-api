import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import { CreateSubscriptionCheckoutSchema } from '../validators/subscription.validator'
import { subscriptionRateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.get('/api/subscription/plans', authMiddleware, SubscriptionController.plans)
router.get('/api/subscription', authMiddleware, SubscriptionController.get)
router.post(
  '/api/subscription/checkout',
  subscriptionRateLimiter,
  authMiddleware,
  validateRequest(CreateSubscriptionCheckoutSchema),
  SubscriptionController.checkout
)
router.delete(
  '/api/subscription',
  subscriptionRateLimiter,
  authMiddleware,
  SubscriptionController.cancel
)

export default router
