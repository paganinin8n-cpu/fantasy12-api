import { Router } from 'express'
import { TeamController } from '../controllers/team/team.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import { UuidIdParamsSchema } from '../validators/common.validator'
import {
  AdminTeamListQuerySchema,
  CreateTeamSchema,
  UpdateTeamSchema,
} from '../validators/team.validator'

const router = Router()

// Public — autocomplete na criação de rodadas
router.get('/api/teams', TeamController.search)

// Admin — CRUD completo
router.get('/api/admin/teams', authMiddleware, authorize('COMPETITION_READ'), validateRequest(AdminTeamListQuerySchema, 'query'), TeamController.list)
router.post('/api/admin/teams', authMiddleware, authorize('COMPETITION_WRITE'), validateRequest(CreateTeamSchema), TeamController.create)
router.put('/api/admin/teams/:id', authMiddleware, authorize('COMPETITION_WRITE'), validateRequest(UuidIdParamsSchema, 'params'), validateRequest(UpdateTeamSchema), TeamController.update)
router.delete('/api/admin/teams/:id', authMiddleware, authorize('COMPETITION_WRITE'), validateRequest(UuidIdParamsSchema, 'params'), TeamController.deactivate)

export default router
