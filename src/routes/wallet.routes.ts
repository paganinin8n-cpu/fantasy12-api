import { Router } from 'express'
import WalletController from '../controllers/wallet.controller'

const router = Router()

router.get('/api/wallet', WalletController.get)

export default router
