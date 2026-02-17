import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'

const router = Router()

/**
 * 🔐 Login
 * - Cria sessão no backend
 * - NÃO retorna usuário
 * - NÃO retorna token
 */
router.post('/login', AuthController.login)

/**
 * 🚪 Logout
 * - Destroi sessão no backend
 */
router.post('/logout', AuthController.logout)

export default router
