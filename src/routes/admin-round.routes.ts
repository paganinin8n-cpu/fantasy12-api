import { Router } from 'express'
import { RoundAdminController } from '../controllers/admin/round-admin.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'

const router = Router()

router.post(
  '/admin/rounds/:roundId/close',
  authMiddleware,
  authorize('COMPETITION_EXECUTE', {
    audit: true,
    entity: 'ROUND',
    getEntityId: (req) => req.params.roundId
  }),
  RoundAdminController.handle
)

export default router