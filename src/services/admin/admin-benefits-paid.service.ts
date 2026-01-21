import { WalletService } from '../wallet/wallet.service';
import { prisma } from '../../lib/prisma';

export class AdminPaidBenefitsService {
  static async creditPaid(
    adminUserId: string,
    userId: string,
    amount: number,
    type: 'DOUBLE' | 'SUPER_DOUBLE'
  ) {
    const cost = type === 'DOUBLE' ? 1 : 2;

    await WalletService.credit(
      userId,
      amount * cost,
      `ADMIN CREDIT ${type}`
    );

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_CREDIT_PAID_BENEFIT',
        entity: 'Wallet',
        entityId: userId,
        metadata: { type, amount },
      },
    });

    return { userId, type, amount };
  }
}
