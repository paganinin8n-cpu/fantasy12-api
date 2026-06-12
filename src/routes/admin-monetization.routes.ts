import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { AdminMonetizationController } from '../controllers/admin/monetization.controller'

const router = Router()

router.get(
  '/admin/monetization/wallet/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  AdminMonetizationController.wallet
)

router.get(
  '/admin/monetization/ledger/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
  AdminMonetizationController.ledger
)

router.get(
  '/admin/monetization/subscriptions/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
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
  AdminMonetizationController.debit
)

router.get(
  '/admin/monetization/benefits/:userId',
  authMiddleware,
  authorize('FINANCE_READ'),
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
  AdminMonetizationController.debitPaidBenefit
)

export default router
