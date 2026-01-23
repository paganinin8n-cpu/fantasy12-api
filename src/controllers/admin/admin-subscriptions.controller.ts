import { Request, Response } from 'express';
import {
  SubscriptionStatus,
  SubscriptionPlan,
  PaymentProvider,
} from '@prisma/client';
import { ListAdminSubscriptionsService } from '../../services/admin/list-admin-subscriptions.service';

/**
 * Controller — Painel ADMIN | Assinaturas
 *
 * RESPONSABILIDADES:
 * - Validar entrada
 * - Orquestrar services
 * - Nenhuma regra de negócio
 *
 * BLOCO:
 * - v1.6 — Painel ADMIN de Assinaturas
 */
export class AdminSubscriptionsController {
  /**
   * GET /api/admin/subscriptions
   */
  static async list(req: Request, res: Response): Promise<Response> {
    const { page, limit, status, plan, provider, userId } = req.query;

    /**
     * 🧮 Paginação segura
     */
    const parsedPage =
      typeof page === 'string' && Number(page) > 0
        ? Number(page)
        : undefined;

    const parsedLimit =
      typeof limit === 'string' && Number(limit) > 0
        ? Number(limit)
        : undefined;

    /**
     * 🔎 Filtros tipados (ALINHADOS AO SCHEMA)
     */
    const parsedStatus =
      typeof status === 'string'
        ? (status as SubscriptionStatus)
        : undefined;

    const parsedPlan =
      typeof plan === 'string'
        ? (plan as SubscriptionPlan)
        : undefined;

    const parsedProvider =
      typeof provider === 'string'
        ? (provider as PaymentProvider)
        : undefined;

    const parsedUserId =
      typeof userId === 'string' ? userId : undefined;

    /**
     * ⚙️ Execução do service
     */
    const result = await ListAdminSubscriptionsService.execute({
      page: parsedPage,
      limit: parsedLimit,
      status: parsedStatus,
      plan: parsedPlan,
      provider: parsedProvider,
      userId: parsedUserId,
    });

    return res.status(200).json(result);
  }
}
