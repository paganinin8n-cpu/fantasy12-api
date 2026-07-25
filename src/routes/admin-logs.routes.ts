import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { ListAdminLogsController } from '../controllers/admin/list-admin-logs.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import { AdminLogsQuerySchema } from '../validators/admin-query.validator'

const router = Router()

router.get(
  '/admin/logs',
  authMiddleware,
  authorize('AUDIT_READ'),
  validateRequest(AdminLogsQuerySchema, 'query'),
  ListAdminLogsController.handle
)

export default router
