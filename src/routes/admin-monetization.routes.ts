import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { AdminMonetizationController } from '../controllers/admin/monetization.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import { UserIdParamsSchema } from '../validators/common.validator'
import {
  AdminBenefitQuerySchema,
  AdminFreeBenefitMutationSchema,
  AdminPaidBenefitMutationSchema,
  AdminWalletMutationSchema,
} from '../validators/admin-monetization.validator'

const router = Router()

router.get(
  '/admin/monetization/wallet/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  validateRequest(UserIdParamsSchema, 'params'),
  AdminMonetizationController.wallet
)

router.get(
  '/admin/monetization/ledger/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  validateRequest(UserIdParamsSchema, 'params'),
  AdminMonetizationController.ledger
)

router.get(
  '/admin/monetization/subscriptions/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  validateRequest(UserIdParamsSchema, 'params'),
  AdminMonetizationController.subscriptions
)

router.post(
  '/admin/monetization/wallet/:userId/credit',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'WALLET',
    getEntityId: (req) => req.params.userId
  }),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminWalletMutationSchema),
  AdminMonetizationController.credit
)

router.post(
  '/admin/monetization/wallet/:userId/debit',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'WALLET',
    getEntityId: (req) => req.params.userId
  }),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminWalletMutationSchema),
  AdminMonetizationController.debit
)

router.get(
  '/admin/monetization/benefits/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminBenefitQuerySchema, 'query'),
  AdminMonetizationController.benefits
)

router.post(
  '/admin/monetization/benefits/:userId/free',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'BENEFIT',
    getEntityId: (req) => req.params.userId
  }),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminFreeBenefitMutationSchema),
  AdminMonetizationController.creditFreeBenefit
)

router.post(
  '/admin/monetization/benefits/:userId/paid',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'BENEFIT',
    getEntityId: (req) => req.params.userId
  }),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminPaidBenefitMutationSchema),
  AdminMonetizationController.creditPaidBenefit
)

router.post(
  '/admin/monetization/benefits/:userId/paid/debit',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'BENEFIT',
    getEntityId: (req) => req.params.userId
  }),
  validateRequest(UserIdParamsSchema, 'params'),
  validateRequest(AdminPaidBenefitMutationSchema),
  AdminMonetizationController.debitPaidBenefit
)

export default router
