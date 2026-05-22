import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { ListAdminUsersController } from '../controllers/admin/list-admin-users.controller'

const router = Router()

router.get(
  '/admin/users',
  authMiddleware,
  authorize('USER_READ'),
  ListAdminUsersController.handle
)

export default router
