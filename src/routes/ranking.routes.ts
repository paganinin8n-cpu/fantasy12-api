import { Router } from 'express';
import { RankingController } from '../controllers/ranking.controller';
import { MonthlyRankingController } from '../controllers/ranking/monthly-ranking.controller';
import { SemesterRankingController } from '../controllers/ranking/semester-ranking.controller';
import { WeeklyRankingController } from '../controllers/ranking/weekly-ranking.controller';
import { JoinBolaoController } from '../services/bolao/join-bolao.controller';
import { ReviewBolaoRequestController } from '../controllers/bolao/review-bolao-request.controller';
import { BolaoRankingController } from '../controllers/bolao/bolao-ranking.controller';
import { CreateBolaoInviteController } from '../controllers/bolao/create-bolao-invite.controller';
import { UseBolaoInviteController } from '../controllers/bolao/use-bolao-invite.controller';
import { ListUserBoloesController } from '../controllers/bolao/list-user-boloes.controller';
import { ListAvailableBoloesController } from '../controllers/bolao/list-available-boloes.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate-request.middleware';
import { RankingIdParamsSchema } from '../validators/common.validator';
import {
  CreateBolaoInviteSchema,
  InviteCodeParamsSchema,
  RankingParticipantParamsSchema,
  ReviewBolaoRequestSchema,
} from '../validators/bolao.validator';

const router = Router();
const controller = new RankingController();

//
// 🔹 Rankings por período (ROTAS ESPECÍFICAS PRIMEIRO)
//
router.get('/rankings/monthly', MonthlyRankingController.handle);
router.get('/rankings/semester', SemesterRankingController.handle);
router.get('/rankings/weekly', WeeklyRankingController.handle);

//
// 🔹 Mesas do usuário autenticado (rotas legadas mantidas por compatibilidade)
//
router.get('/mesas/me', authMiddleware, ListUserBoloesController.handle);
router.get('/mesas/available', authMiddleware, ListAvailableBoloesController.handle);
router.get('/boloes/me', authMiddleware, ListUserBoloesController.handle);
router.get('/boloes/available', authMiddleware, ListAvailableBoloesController.handle);
// Criação de Mesa é exclusiva do admin: POST /api/admin/mesas


//
// 🔹 Ranking genérico por ID (SEMPRE POR ÚLTIMO)
//
router.get('/rankings/:rankingId', controller.show);

//
// 🔹 Entrada direta em bolão
//
router.post('/rankings/:rankingId/join', authMiddleware, validateRequest(RankingIdParamsSchema, 'params'), JoinBolaoController.handle);
router.patch(
  '/rankings/:rankingId/participants/:participantId',
  authMiddleware,
  validateRequest(RankingParticipantParamsSchema, 'params'),
  validateRequest(ReviewBolaoRequestSchema),
  ReviewBolaoRequestController.handle
);

//
// 🔹 Ranking de leitura da Mesa
//
router.get('/rankings/:rankingId/mesa', authMiddleware, BolaoRankingController.handle);
router.post('/rankings/:rankingId/mesa/close', authMiddleware, validateRequest(RankingIdParamsSchema, 'params'), BolaoRankingController.close);
router.get('/rankings/:rankingId/bolao', authMiddleware, BolaoRankingController.handle);
router.post('/rankings/:rankingId/bolao/close', authMiddleware, validateRequest(RankingIdParamsSchema, 'params'), BolaoRankingController.close);

//
// 🔹 Convites de Mesa
//
router.post('/rankings/:rankingId/invites', authMiddleware, validateRequest(RankingIdParamsSchema, 'params'), validateRequest(CreateBolaoInviteSchema), CreateBolaoInviteController.handle);
router.post('/mesas/invites/:code/join', authMiddleware, validateRequest(InviteCodeParamsSchema, 'params'), UseBolaoInviteController.handle);
router.post('/boloes/invites/:code/join', authMiddleware, validateRequest(InviteCodeParamsSchema, 'params'), UseBolaoInviteController.handle);

export default router;
