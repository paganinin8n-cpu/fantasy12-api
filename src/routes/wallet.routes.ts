import { Router } from 'express'
import WalletController from '../controllers/wallet.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/api/wallet', authMiddleware, WalletController.get)

export default router
