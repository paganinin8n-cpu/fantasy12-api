import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { MeController } from '../controllers/me.controller'

const router = Router()

router.get('/me', authMiddleware, MeController.handle)

export default router
