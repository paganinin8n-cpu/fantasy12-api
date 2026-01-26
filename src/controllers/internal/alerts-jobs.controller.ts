import { Request, Response } from 'express';

import { DetectSubscriptionAlertsService } from '../../services/alerts/detect-subscription-anomalies.service';
import { DetectPaymentAlertsService } from '../../services/alerts/detect-payment-anomalies.service';
import { DetectWebhookAlertsService } from '../../services/alerts/detect-webhook-anomalies.service';
import { DetectJobAnomaliesService } from '../../services/alerts/detect-job-anomalies.service';

/**
 * Controller — Jobs de Alertas Operacionais
 *
 * RESPONSABILIDADES:
 * - Orquestrar execução dos alertas
 * - Nenhuma regra de negócio
 * - Nenhuma escrita em banco
 *
 * BLOCO:
 * - v1.9 — Alertas Operacionais
 */
export class AlertsJobsController {
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
      await DetectSubscriptionAlertsService.execute();
      await DetectPaymentAlertsService.execute();
      await DetectWebhookAlertsService.execute();
      await DetectJobAnomaliesService.execute();

      console.info({
        level: 'INFO',
        service: 'AlertsJobsController',
        action: 'alerts.run.finish',
        message: 'Execução dos alertas operacionais concluída',
        timestamp,
      });

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error({
        level: 'CRITICAL',
        service: 'AlertsJobsController',
        action: 'alerts.run.error',
        message: 'Falha na execução dos alertas operacionais',
        error,
        timestamp,
      });

      return res.status(200).json({ status: 'error_logged' });
    }
  }
}
