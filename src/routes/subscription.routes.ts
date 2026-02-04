import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller'

const router = Router()

router.get('/api/subscription', SubscriptionController.get)

export default router
