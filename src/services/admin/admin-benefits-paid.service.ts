import { prisma } from '../../lib/prisma';

export class AdminPaidBenefitsService {
  static async creditPaid(
    adminUserId: string,
    userId: string,
    amount: number,
    type: 'DOUBLE' | 'SUPER_DOUBLE'
  ) {
    if (amount <= 0) throw new Error('Invalid amount');

    const inventory = await prisma.userBenefitInventory.upsert({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      update: {
        quantity: { increment: amount },
      },
      create: {
        userId,
        type,
        quantity: amount,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_CREDIT_PAID_BENEFIT',
        entity: 'UserBenefitInventory',
        entityId: inventory.id,
        metadata: { type, amount },
      },
    });

    return inventory;
  }

  static async debitPaid(
    adminUserId: string,
    userId: string,
    amount: number,
    type: 'DOUBLE' | 'SUPER_DOUBLE'
  ) {
    if (amount <= 0) throw new Error('Invalid amount');

    const current = await prisma.userBenefitInventory.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    if (!current || current.quantity < amount) {
      throw new Error('Saldo de benefícios insuficiente');
    }

    const inventory = await prisma.userBenefitInventory.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data: {
        quantity: { decrement: amount },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_DEBIT_PAID_BENEFIT',
        entity: 'UserBenefitInventory',
        entityId: inventory.id,
        metadata: { targetUserId: userId, type, amount },
      },
    });

    return inventory;
  }
}
