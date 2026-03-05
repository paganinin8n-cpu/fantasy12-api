import { Router } from 'express'
import { RoundAdminController } from '../controllers/admin/round-admin.controller'
import { CreateRoundController } from '../controllers/admin/create-round.controller'
import { OpenRoundController } from '../controllers/admin/open-round.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'

const router = Router()

/**
 * ADMIN — Criar nova rodada
 */
router.post(
  '/admin/rounds',
  authMiddleware,
  authorize('COMPETITION_WRITE', {
    audit: true,
    entity: 'ROUND'
  }),
  CreateRoundController.handle
)

/**
 * ADMIN — Abrir rodada
 */
router.post(
  '/admin/rounds/:roundId/open',
  authMiddleware,
  authorize('COMPETITION_EXECUTE', {
    audit: true,
    entity: 'ROUND',
    getEntityId: (req) => req.params.roundId
  }),
  OpenRoundController.handle
)

/**
 * ADMIN — Fechar rodada
 */
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