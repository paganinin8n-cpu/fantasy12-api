import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';
import { MonthlyRankingController } from '../controllers/ranking/monthly-ranking.controller';
import { SemesterRankingController } from '../controllers/ranking/semester-ranking.controller';
import { WeeklyRankingController } from '../controllers/ranking/weekly-ranking.controller';
import { JoinBolaoController } from '../services/bolao/join-bolao.controller';
import { BolaoRankingController } from '../controllers/bolao/bolao-ranking.controller';
import { CreateBolaoInviteController } from '../controllers/bolao/create-bolao-invite.controller';
import { UseBolaoInviteController } from '../controllers/bolao/use-bolao-invite.controller';
import { ListUserBoloesController } from '../controllers/bolao/list-user-boloes.controller';
import { ListAvailableBoloesController } from '../controllers/bolao/list-available-boloes.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { CreateBolaoController } from '../controllers/bolao/create-bolao.controller';

const router = Router();
const controller = new RankingController();

//
// 🔹 Rankings por período (ROTAS ESPECÍFICAS PRIMEIRO)
//
router.get('/rankings/monthly', MonthlyRankingController.handle);
router.get('/rankings/semester', SemesterRankingController.handle);
router.get('/rankings/weekly', WeeklyRankingController.handle);

//
// 🔹 Bolões do usuário autenticado
//
router.get('/boloes/me', authMiddleware, ListUserBoloesController.handle);
router.get('/boloes/available', authMiddleware, ListAvailableBoloesController.handle);
router.post('/boloes', authMiddleware, CreateBolaoController.handle);

//
// 🔹 Ranking genérico por ID (SEMPRE POR ÚLTIMO)
//
router.get('/rankings/:rankingId', controller.show);

//
// 🔹 Entrada direta em bolão
//
router.post('/rankings/:rankingId/join', authMiddleware, JoinBolaoController.handle);

//
// 🔹 Ranking de leitura do bolão
//
router.get('/rankings/:rankingId/bolao', authMiddleware, BolaoRankingController.handle);

//
// 🔹 Convites de bolão
//
router.post('/rankings/:rankingId/invites', authMiddleware, CreateBolaoInviteController.handle);
router.post('/boloes/invites/:code/join', authMiddleware, UseBolaoInviteController.handle);

export default router;
