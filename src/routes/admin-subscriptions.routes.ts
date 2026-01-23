import { Router } from 'express';
import { AdminSubscriptionsController } from '../controllers/admin/admin-subscriptions.controller';

const router = Router();

/**
 * Painel ADMIN — Assinaturas
 *
 * Prefixo final:
 * /api/admin/subscriptions
 */
router.get('/admin/subscriptions', AdminSubscriptionsController.list);

export default router;
