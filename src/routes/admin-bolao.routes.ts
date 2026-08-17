import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import { CreateMesaSchema } from '../validators/bolao.validator'
import { AdminBolaoController } from '../controllers/bolao/admin-bolao.controller'

const router = Router()

router.get(
  '/api/admin/mesas/integrity',
  authMiddleware,
  authorize('COMPETITION_READ', {
    audit: true,
    entity: 'BOLAO_INTEGRITY',
  }),
  AdminBolaoController.integrity
)

router.get(
  '/api/admin/mesas',
  authMiddleware,
  authorize('COMPETITION_READ'),
  AdminBolaoController.list
)

router.get(
  '/api/admin/boloes',
  authMiddleware,
  authorize('COMPETITION_READ'),
  AdminBolaoController.list
)

router.post(
  '/api/admin/mesas',
  authMiddleware,
  authorize('COMPETITION_WRITE', {
    audit: true,
    entity: 'BOLAO',
  }),
  validateRequest(CreateMesaSchema),
  AdminBolaoController.create
)

router.post(
  '/api/admin/boloes',
  authMiddleware,
  authorize('COMPETITION_WRITE', {
    audit: true,
    entity: 'BOLAO',
  }),
  validateRequest(CreateMesaSchema),
  AdminBolaoController.create
)

export default router
