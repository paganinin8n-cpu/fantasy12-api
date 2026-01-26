import { Request, Response } from 'express';
import { AdminBillingMetricsService } from '../../services/admin/admin-billing-metrics.service';

/**
 * Controller — Painel ADMIN | Métricas de Billing
 *
 * RESPONSABILIDADES:
 * - Orquestrar service
 * - Nenhuma regra de negócio
 * - Somente leitura
 *
 * BLOCO:
 * - v1.8 — Métricas de Billing
 */
export class AdminBillingMetricsController {
  /**
   * GET /api/admin/billing/metrics
   */
  static async getMetrics(_req: Request, res: Response): Promise<Response> {
    const metrics = await AdminBillingMetricsService.execute();
    return res.status(200).json(metrics);
  }
}
