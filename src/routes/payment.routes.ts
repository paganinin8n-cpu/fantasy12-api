import { Router } from 'express'
import { PaymentsController } from '../controllers/PaymentsController'

const router = Router()

router.post('/api/payments', PaymentsController.create)
router.get('/api/payments/history', PaymentsController.history)

export default router
