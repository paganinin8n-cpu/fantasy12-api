import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { ListAdminUsersController } from '../controllers/admin/list-admin-users.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  AdminUserReasonSchema,
  AdminUserSubscriptionSchema,
} from '../validators/admin-user.validator'

const router = Router()

router.get(
  '/admin/users',
  authMiddleware,
  authorize('USER_READ'),
  ListAdminUsersController.handle
)

router.post(
  '/admin/users/:userId/block',
  authMiddleware,
  authorize('USER_WRITE', {
    audit: true,
    entity: 'USER',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserReasonSchema),
  ListAdminUsersController.block
)

router.post(
  '/admin/users/:userId/unblock',
  authMiddleware,
  authorize('USER_WRITE', {
    audit: true,
    entity: 'USER',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserReasonSchema),
  ListAdminUsersController.unblock
)

router.post(
  '/admin/users/:userId/subscription',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'SUBSCRIPTION',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserSubscriptionSchema),
  ListAdminUsersController.setSubscription
)

router.post(
  '/admin/users/:userId/subscription/cancel',
  authMiddleware,
  authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'SUBSCRIPTION',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserReasonSchema),
  ListAdminUsersController.cancelSubscription
)

export default router
