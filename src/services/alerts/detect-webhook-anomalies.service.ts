import { prisma } from '../../lib/prisma';

export class DetectWebhookAlertsService {
  static async execute(): Promise<void> {
    const timestamp = new Date().toISOString();

    const recentEvents = await prisma.paymentWebhookEvent.count({
      where: {
        receivedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // últimos 5 minutos
        },
      },
    });

    if (recentEvents > 100) {
      console.warn({
        level: 'WARN',
        service: 'DetectWebhookAlertsService',
        action: 'webhook.high_volume',
        message: `Volume elevado de webhooks nos últimos 5 minutos (${recentEvents})`,
        timestamp,
      });
    }
  }
}
