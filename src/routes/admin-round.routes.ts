import { Router } from 'express';
import { RoundAdminController } from '../controllers/admin/round-admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/requireRole';

const router = Router();

/**
 * POST /admin/rounds/:roundId/close
 * Fecha e apura oficialmente uma rodada
 */
router.post(
  '/admin/rounds/:roundId/close',
  authMiddleware,
  requireRole(['ADMIN']),
  RoundAdminController.handle
);

export default router;
