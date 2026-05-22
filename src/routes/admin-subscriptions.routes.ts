import { Router } from 'express'
import { AdminSubscriptionsController } from '../controllers/admin/admin-subscriptions.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'

const router = Router()

/**
 * Painel ADMIN — Assinaturas
 *
 * Prefixo final:
 * /api/admin/subscriptions
 */
router.get(
  '/admin/subscriptions',
  authMiddleware,
  authorize('FINANCE_READ'),
  AdminSubscriptionsController.list
)

export default router
