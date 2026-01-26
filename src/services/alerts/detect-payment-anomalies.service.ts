import { prisma } from '../../lib/prisma';

export class DetectPaymentAlertsService {
  static async execute(): Promise<void> {
    const timestamp = new Date().toISOString();

    const anomalousPayments = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        isCredited: false,
      },
    });

    for (const payment of anomalousPayments) {
      console.error({
        level: 'CRITICAL',
        service: 'DetectPaymentAlertsService',
        action: 'payment.approved_not_credited',
        paymentId: payment.id,
        userId: payment.userId,
        message: 'Pagamento aprovado sem crédito na wallet',
        timestamp,
      });
    }
  }
}
