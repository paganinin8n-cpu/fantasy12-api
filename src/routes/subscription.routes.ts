import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/api/subscription/plans', authMiddleware, SubscriptionController.plans)
router.get('/api/subscription', authMiddleware, SubscriptionController.get)
router.delete('/api/subscription', authMiddleware, SubscriptionController.cancel)

export default router
