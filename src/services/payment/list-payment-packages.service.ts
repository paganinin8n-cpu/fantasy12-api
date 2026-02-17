import { prisma } from '../../lib/prisma'

export class ListPaymentPackagesService {
  static async execute() {
    return prisma.paymentPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        amountCents: 'asc',
      },
      select: {
        id: true,
        label: true,
        coinsAmount: true,
        bonusCoins: true,
        amountCents: true,
      },
    })
  }
}
