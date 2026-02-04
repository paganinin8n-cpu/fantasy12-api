import { Router } from 'express'
import PaymentController from '../controllers/payment.controller'
import { PaymentsHistoryController } from '../controllers/PaymentsHistoryController'

const router = Router()

router.post('/api/payments', PaymentController.create)
router.get('/api/payments/history', PaymentsHistoryController.history)

export default router
