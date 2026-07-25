import { Router } from 'express'
import { CancelRoundController } from '../controllers/admin/cancel-round.controller'
import { RoundAdminController } from '../controllers/admin/round-admin.controller'
import { CreateRoundController } from '../controllers/admin/create-round.controller'
import { ListRoundsController } from '../controllers/admin/list-rounds.controller'
import { OpenRoundController } from '../controllers/admin/open-round.controller'
import { SetRoundResultController } from '../controllers/admin/set-round-result.controller'
import { UpdateRoundController } from '../controllers/admin/update-round.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import { RoundIdParamsSchema } from '../validators/common.validator'
import {
  CreateRoundSchema,
  EmptyBodySchema,
  SetRoundResultSchema,
  UpdateRoundSchema,
} from '../validators/round-admin.validator'


const router = Router()

router.get(
  '/admin/rounds',
  authMiddleware,
  authorize('COMPETITION_READ'),
  ListRoundsController.handle
)

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
  validateRequest(CreateRoundSchema),
  CreateRoundController.handle
)

router.patch(
  '/admin/rounds/:roundId',
  authMiddleware,
  authorize('COMPETITION_WRITE', {
    audit: true,
    entity: 'ROUND',
    getEntityId: (req) => req.params.roundId
  }),
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(UpdateRoundSchema),
  UpdateRoundController.handle
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
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(EmptyBodySchema),
  OpenRoundController.handle
)

/**
 * ADMIN — Resultado
 */
router.post(
  '/admin/rounds/:roundId/result',
  authMiddleware,
  authorize('COMPETITION_EXECUTE', {
    audit: true,
    entity: 'ROUND',
    getEntityId: (req) => req.params.roundId
  }),
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(SetRoundResultSchema),
  SetRoundResultController.handle
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
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(EmptyBodySchema),
  RoundAdminController.handle
)

router.post(
  '/admin/rounds/:roundId/cancel',
  authMiddleware,
  authorize('COMPETITION_EXECUTE', {
    audit: true,
    entity: 'ROUND',
    getEntityId: (req) => req.params.roundId
  }),
  validateRequest(RoundIdParamsSchema, 'params'),
  validateRequest(EmptyBodySchema),
  CancelRoundController.handle
)

export default router
