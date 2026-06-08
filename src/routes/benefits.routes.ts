import { Router } from 'express'
import { BenefitsController } from '../controllers/benefits.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  BenefitBalanceQuerySchema,
  PurchaseBenefitsSchema,
} from '../validators/benefits.validator'
import { benefitPurchaseRateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

router.get(
  '/benefits/balance',
  authMiddleware,
  validateRequest(BenefitBalanceQuerySchema, 'query'),
  BenefitsController.balance
)

router.post(
  '/benefits/purchase',
  benefitPurchaseRateLimiter,
  authMiddleware,
  validateRequest(PurchaseBenefitsSchema),
  BenefitsController.purchase
)

export default router
