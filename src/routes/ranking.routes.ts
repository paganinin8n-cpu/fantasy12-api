import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';

const router = Router();
const controller = new RankingController();

//
// GET /rankings/:rankingId
//
router.get('/rankings/:rankingId', controller.show);

//
// POST /rankings/:rankingId/participants
//
router.post('/rankings/:rankingId/participants', controller.addParticipant);

export default router;
