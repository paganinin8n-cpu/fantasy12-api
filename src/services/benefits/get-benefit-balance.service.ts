import { prisma } from '../../lib/prisma'

export class GetBenefitBalanceService {
  static async execute(userId: string, roundId?: string) {
    const [roundBenefit, doubleInventory, superInventory, wallet] =
      await Promise.all([
        roundId
          ? prisma.roundBenefit.findUnique({
              where: {
                userId_roundId: {
                  userId,
                  roundId,
                },
              },
            })
          : Promise.resolve(null),
        prisma.userBenefitInventory.findUnique({
          where: {
            userId_type: {
              userId,
              type: 'DOUBLE',
            },
          },
        }),
        prisma.userBenefitInventory.findUnique({
          where: {
            userId_type: {
              userId,
              type: 'SUPER_DOUBLE',
            },
          },
        }),
        prisma.wallet.findUnique({
          where: { userId },
          select: { balance: true },
        }),
      ])

    const freeDoubles = roundBenefit?.freeDoubles ?? 0
    const freeSuperDoubles = roundBenefit?.freeSuperDoubles ?? 0
    const paidDoubles = doubleInventory?.quantity ?? 0
    const paidSuperDoubles = superInventory?.quantity ?? 0
    const totalDoubles = freeDoubles + paidDoubles
    const totalSuperDoubles = freeSuperDoubles + paidSuperDoubles

    return {
      roundId: roundId ?? null,
      freeDoubles,
      freeSuperDoubles,
      paidDoubles,
      paidSuperDoubles,
      totalDoubles,
      totalSuperDoubles,
      availableDoubles: totalDoubles,
      availableSuperDoubles: totalSuperDoubles,
      walletBalance: wallet?.balance ?? 0,
    }
  }
}
