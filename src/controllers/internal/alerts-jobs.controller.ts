import { Request, Response } from 'express';

import { DetectSubscriptionAlertsService } from '../../services/alerts/detect-subscription-alerts.service';
import { DetectPaymentAlertsService } from '../../services/alerts/detect-payment-alerts.service';
import { DetectWebhookAlertsService } from '../../services/alerts/detect-webhook-alerts.service';
import { DetectJobAnomaliesService } from '../../services/alerts/detect-job-anomalies.service';

/**
 * Controller — Jobs de Alertas Operacionais
 *
 * RESPONSABILIDADES:
 * - Orquestrar execução dos alertas
 * - Não conter regra de negócio
 * - Não persistir dados
 * - Executar apenas leitura e detecção
 *
 * BLOCO:
 * - v1.9 — Alertas Operacionais
 */
export class AlertsJobsController {
  /**
   * POST /internal/jobs/alerts/run
   *
   * Pode ser executado via:
   * - cron interno
   * - EasyPanel scheduler
   * - chamada manual protegida
   */
  static async run(_req: Request, res: Response): Promise<Response> {
    const timestamp = new Date().toISOString();

    console.info({
      level: 'INFO',
      service: 'AlertsJobsController',
      action: 'alerts.run.start',
      message: 'Início da execução dos alertas operacionais',
      timestamp,
    });

    try {
      /**
       * 🔔 ALERTAS DE ASSINATURA
       * - Inconsistência status x papel
       */
      await DetectSubscriptionAlertsService.execute();

      /**
       * 💳 ALERTAS DE PAGAMENTO
       * - Pagamento aprovado sem crédito
       */
      await DetectPaymentAlertsService.execute();

      /**
       * 🌐 ALERTAS DE WEBHOOK
       * - Volume anormal de eventos
       */
      await DetectWebhookAlertsService.execute();

      /**
       * ⚙️ ALERTAS DE JOB
       * - Job possivelmente travado
       * - Ausência de atividade
       */
      await DetectJobAnomaliesService.execute();

      console.info({
        level: 'INFO',
        service: 'AlertsJobsController',
        action: 'alerts.run.finish',
        message: 'Execução dos alertas operacionais concluída com sucesso',
        timestamp,
      });

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error({
        level: 'CRITICAL',
        service: 'AlertsJobsController',
        action: 'alerts.run.error',
        message: 'Falha inesperada na execução dos alertas operacionais',
        error,
        timestamp,
      });

      /**
       * ⚠️ IMPORTANTE
       * Mesmo em caso de erro:
       * - não lançar exceção
       * - não quebrar o processo
       * - retornar resposta controlada
       */
      return res.status(200).json({ status: 'error_logged' });
    }
  }
}
