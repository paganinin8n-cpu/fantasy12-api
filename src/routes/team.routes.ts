import { Router } from 'express'
import { TeamController } from '../controllers/team/team.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'

const router = Router()

// Public — autocomplete na criação de rodadas
router.get('/api/teams', TeamController.search)

// Admin — CRUD completo
router.get('/api/admin/teams', authMiddleware, authorize('COMPETITION_READ'), TeamController.list)
router.post('/api/admin/teams', authMiddleware, authorize('COMPETITION_WRITE'), TeamController.create)
router.put('/api/admin/teams/:id', authMiddleware, authorize('COMPETITION_WRITE'), TeamController.update)
router.delete('/api/admin/teams/:id', authMiddleware, authorize('COMPETITION_WRITE'), TeamController.deactivate)

export default router
