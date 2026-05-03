import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { MeController } from '../controllers/me.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
} from '../validators/me.validator'

const router = Router()

router.get('/me', authMiddleware, MeController.handle)

router.patch(
  '/me',
  authMiddleware,
  validateRequest(UpdateProfileSchema),
  MeController.update
)

router.post(
  '/me/password',
  authMiddleware,
  validateRequest(ChangePasswordSchema),
  MeController.changePassword
)

export default router
