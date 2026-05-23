import { Router } from 'express'
import { BenefitsController } from '../controllers/benefits.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  BenefitBalanceQuerySchema,
  PurchaseBenefitsSchema,
} from '../validators/benefits.validator'

const router = Router()

router.get(
  '/benefits/balance',
  authMiddleware,
  validateRequest(BenefitBalanceQuerySchema, 'query'),
  BenefitsController.balance
)

router.post(
  '/benefits/purchase',
  authMiddleware,
  validateRequest(PurchaseBenefitsSchema),
  BenefitsController.purchase
)

export default router
