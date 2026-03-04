import { Router } from 'express'
import { internalJobAuth } from '../middleware/internalJobAuth'
import { authorize } from '../middleware/authorize.middleware'
import { GenerateRankingSnapshotController } from '../controllers/internal/generate-ranking-snapshot.controller'

const router = Router()

router.post(
  '/jobs/generate-ranking-snapshot',
  internalJobAuth,
  authorize('JOB_EXECUTE', {
    audit: true,
    entity: 'RANKING_SNAPSHOT'
  }),
  GenerateRankingSnapshotController.handle
)

export default router