import { Router } from 'express'
import { PaymentController } from '../controllers/payment.controller'
import { PaymentPackagesController } from '../controllers/payment-packages.controller'
import { PaymentsHistoryController } from '../controllers/PaymentsHistoryController'

const router = Router()

router.post('/payments', PaymentController.handle)
router.get('/payment-packages', PaymentPackagesController.handle)
router.get('/payments/history', PaymentsHistoryController.handle)

export default router
