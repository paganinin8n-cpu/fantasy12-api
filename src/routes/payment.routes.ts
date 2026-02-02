import { Router } from 'express'
import { PaymentController } from '../controllers/PaymentController'

const router = Router()

router.post('/api/payments', PaymentController.create)
router.get('/api/payment/history', PaymentController.history)

export default router
