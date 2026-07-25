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
    const { page, limit, status, plan, provider, userId } = req.query as any;

    /**
     * 🔎 Filtros tipados (ALINHADOS AO SCHEMA)
     */
    const parsedStatus =
      status as SubscriptionStatus | undefined;

    const parsedPlan =
      plan as SubscriptionPlan | undefined;

    const parsedProvider =
      provider as PaymentProvider | undefined;

    const parsedUserId =
      userId as string | undefined;

    /**
     * ⚙️ Execução do service
     */
    const result = await ListAdminSubscriptionsService.execute({
      page,
      limit,
      status: parsedStatus,
      plan: parsedPlan,
      provider: parsedProvider,
      userId: parsedUserId,
    });

    return res.status(200).json(result);
  }
}
