import { prisma } from '../../lib/prisma';

type BenefitType = 'DOUBLE' | 'SUPER_DOUBLE';

export class AdminBenefitsService {
  static async creditFree(
    adminUserId: string,
    userId: string,
    roundId: string,
    type: BenefitType,
    amount: number
  ) {
    if (amount <= 0) throw new Error('Invalid amount');

    const field =
      type === 'DOUBLE' ? 'freeDoubles' : 'freeSuperDoubles';

    const benefit = await prisma.roundBenefit.upsert({
      where: { userId_roundId: { userId, roundId } },
      update: {
        [field]: { increment: amount },
      },
      create: {
        userId,
        roundId,
        freeDoubles: type === 'DOUBLE' ? amount : 0,
        freeSuperDoubles: type === 'SUPER_DOUBLE' ? amount : 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_CREDIT_FREE_BENEFIT',
        entity: 'RoundBenefit',
        entityId: benefit.id,
        metadata: { userId, roundId, type, amount },
      },
    });

    return benefit;
  }
}
