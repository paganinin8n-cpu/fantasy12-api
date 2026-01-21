import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';
import { MonthlyRankingController } from '../controllers/ranking/monthly-ranking.controller';
import { SemesterRankingController } from '../controllers/ranking/semester-ranking.controller';
import { WeeklyRankingController } from '../controllers/ranking/weekly-ranking.controller';
import { JoinBolaoController } from '../controllers/bolao/join-bolao.controller';
import { BolaoRankingController } from '../controllers/bolao/bolao-ranking.controller';
import { CreateBolaoInviteController } from '../controllers/bolao/create-bolao-invite.controller';
import { UseBolaoInviteController } from '../controllers/bolao/use-bolao-invite.controller';

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

//
// 🔹 Rankings por período
//
router.get('/rankings/monthly', MonthlyRankingController.handle);
router.get('/rankings/semester', SemesterRankingController.handle);
router.get('/rankings/weekly', WeeklyRankingController.handle);

//
// 🔹 Entrada direta em bolão
//
router.post('/rankings/:rankingId/join', JoinBolaoController.handle);

//
// 🔹 Ranking de leitura do bolão
//
router.get('/rankings/:rankingId/bolao', BolaoRankingController.handle);

//
// 🔹 Convites de bolão
//
router.post('/rankings/:rankingId/invites', CreateBolaoInviteController.handle);
router.post('/boloes/invites/:code/join', UseBolaoInviteController.handle);

export default router;
