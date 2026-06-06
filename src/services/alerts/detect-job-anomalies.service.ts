import { prisma } from '../../lib/prisma';
import { AlertDispatcherService } from './alert-dispatcher.service';

export class DetectJobAnomaliesService {
  /**
   * Detecta possíveis falhas de execução de jobs internos
   *
   * Estratégia v1.9 (stateless):
   * - Usa sinais indiretos
   * - Ex: ausência de eventos recentes esperados
   * - Não persiste estado
   */
  static async execute(): Promise<void> {
    const timestamp = new Date().toISOString();

    /**
     * Exemplo: job de revalidação deveria gerar logs/eventos indiretos
     * Usamos paymentWebhookEvent como proxy de atividade do sistema
     */
    const lastEvent = await prisma.paymentWebhookEvent.findFirst({
      orderBy: {
        receivedAt: 'desc',
      },
    });

    if (!lastEvent) {
      await AlertDispatcherService.dispatch({
        level: 'CRITICAL',
        service: 'DetectJobAnomaliesService',
        action: 'job.no_activity_detected',
        message:
          'Nenhum evento recente encontrado — possível falha de jobs internos',
        timestamp,
      });

      return;
    }

    const diffMinutes =
      (Date.now() - lastEvent.receivedAt.getTime()) / 60000;

    if (diffMinutes > 60) {
      await AlertDispatcherService.dispatch({
        level: 'WARN',
        service: 'DetectJobAnomaliesService',
        action: 'job.possible_stall',
        message: `Sistema sem atividade relevante há ${Math.floor(
          diffMinutes
        )} minutos`,
        timestamp,
        data: {
          lastEventAt: lastEvent.receivedAt.toISOString(),
          diffMinutes: Math.floor(diffMinutes),
        },
      });
    }
  }
}
