import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { PasswordResetController } from '../controllers/password-reset.controller'
import { validateRequest } from '../middleware/validate-request.middleware'
import { LoginSchema } from '../validators/auth.validator'
import {
  RequestPasswordResetSchema,
  ResetPasswordSchema,
} from '../validators/password-reset.validator'
import { loginRateLimiter } from '../middleware/rate-limit.middleware'

const router = Router()

/**
 * 🔐 Login
 * - Cria sessão no backend
 * - NÃO retorna usuário
 * - NÃO retorna token
 */
router.post(
  '/login',
  loginRateLimiter,
  validateRequest(LoginSchema),
  AuthController.login
)

/**
 * 🔑 Recuperação de senha
 */
router.post(
  '/forgot-password',
  loginRateLimiter,
  validateRequest(RequestPasswordResetSchema),
  PasswordResetController.request
)

router.post(
  '/reset-password',
  loginRateLimiter,
  validateRequest(ResetPasswordSchema),
  PasswordResetController.confirm
)

/**
 * 🚪 Logout
 * - Destroi sessão no backend
 */
router.post('/logout', AuthController.logout)

export default router
