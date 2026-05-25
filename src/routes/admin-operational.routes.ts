import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { OperationalStatusController } from '../controllers/admin/operational-status.controller'

const router = Router()

router.get(
  '/admin/operational/status',
  authMiddleware,
  authorize('AUDIT_READ'),
  OperationalStatusController.handle
)

export default router
