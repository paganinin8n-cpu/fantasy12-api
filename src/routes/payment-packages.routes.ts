import { Router } from 'express'
import { PaymentPackagesController } from '../controllers/payment-packages.controller'

const router = Router()

router.get('/api/payment-packages', PaymentPackagesController.handle)

export default router
