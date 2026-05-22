import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { ListAdminLogsController } from '../controllers/admin/list-admin-logs.controller'

const router = Router()

router.get(
  '/admin/logs',
  authMiddleware,
  authorize('AUDIT_READ'),
  ListAdminLogsController.handle
)

export default router
