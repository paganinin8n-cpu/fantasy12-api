import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { ListAdminUsersController } from '../controllers/admin/list-admin-users.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  AdminUserReasonSchema,
  AdminUserRolesSchema,
  AdminUserSubscriptionSchema,
} from '../validators/admin-user.validator'

const router = Router()

router.get(
  '/admin/users',
  authMiddleware,
  authorize('USER_READ'),
  ListAdminUsersController.handle
)

router.get(
  '/admin/users/:userId/history',
  authMiddleware,
  authorize('AUDIT_READ'),
  ListAdminUsersController.history
)

router.post(
  '/admin/users/:userId/admin-roles',
  authMiddleware,
  authorize('USER_WRITE', {
    audit: true,
    entity: 'USER',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserRolesSchema),
  ListAdminUsersController.setAdminRoles
)

router.post(
  '/admin/users/:userId/block',
  authMiddleware,
  authorize('USER_BLOCK', {
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
  authorize('USER_UNBLOCK', {
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
  authorize('USER_PLAN_WRITE', {
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
  authorize('USER_PLAN_WRITE', {
    audit: true,
    entity: 'SUBSCRIPTION',
    getEntityId: req => req.params.userId,
  }),
  validateRequest(AdminUserReasonSchema),
  ListAdminUsersController.cancelSubscription
)

export default router
