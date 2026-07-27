import { Router } from 'express'
import { ArtController } from '../controllers/art/art.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { authorize } from '../middleware/authorize.middleware'
import { validateRequest } from '../middleware/validate-request.middleware'
import {
  AdminArtListQuerySchema,
  CreateArtSchema,
  PublicArtListQuerySchema,
  UpdateArtSchema,
} from '../validators/art.validator'
import { UuidIdParamsSchema } from '../validators/common.validator'

const router = Router()

router.get('/api/arts', validateRequest(PublicArtListQuerySchema, 'query'), ArtController.publicList)
router.get(
  '/api/arts/:id/image',
  validateRequest(UuidIdParamsSchema, 'params'),
  ArtController.image,
)

router.get(
  '/api/admin/arts',
  authMiddleware,
  authorize('COMPETITION_READ'),
  validateRequest(AdminArtListQuerySchema, 'query'),
  ArtController.adminList,
)
router.post(
  '/api/admin/arts',
  authMiddleware,
  authorize('COMPETITION_WRITE'),
  validateRequest(CreateArtSchema),
  ArtController.create,
)
router.put(
  '/api/admin/arts/:id',
  authMiddleware,
  authorize('COMPETITION_WRITE'),
  validateRequest(UuidIdParamsSchema, 'params'),
  validateRequest(UpdateArtSchema),
  ArtController.update,
)
router.delete(
  '/api/admin/arts/:id',
  authMiddleware,
  authorize('COMPETITION_WRITE'),
  validateRequest(UuidIdParamsSchema, 'params'),
  ArtController.remove,
)

export default router
