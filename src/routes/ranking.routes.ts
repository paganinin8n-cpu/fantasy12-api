import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';

const router = Router();
const controller = new RankingController();

/**
 * GET /rankings/:rankingId
 * Público — somente leitura
 */
router.get('/rankings/:rankingId', controller.show);

export default router;
