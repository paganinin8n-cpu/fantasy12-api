import { Router } from 'express';
import { internalJobAuth } from '../middleware/internalJobAuth';
import { GenerateRankingSnapshotController } from '../controllers/internal/generate-ranking-snapshot.controller';

const router = Router();

router.post(
  '/jobs/generate-ranking-snapshot',
  internalJobAuth,
  GenerateRankingSnapshotController.handle
);

export default router;
