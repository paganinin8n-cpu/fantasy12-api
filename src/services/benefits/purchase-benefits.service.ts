import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import {
  BENEFIT_PURCHASE_PACKAGES,
  BenefitPurchasePackageId,
} from './benefits.config'
import { WalletService } from '../wallet/wallet.service'

type PurchaseBenefitsInput = {
  userId: string
  packageId: BenefitPurchasePackageId
}

export class PurchaseBenefitsService {
  static async execute({ userId, packageId }: PurchaseBenefitsInput) {
    const pkg = BENEFIT_PURCHASE_PACKAGES[packageId]

    if (!pkg) {
      throw AppError.badRequest('Pacote tático inválido', 'invalid_benefit_package')
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await WalletService.debit(
        userId,
        pkg.cost,
        `Purchase ${pkg.quantity} ${pkg.type}`,
        tx
      )

      const inventory = await tx.userBenefitInventory.upsert({
        where: {
          userId_type: {
            userId,
            type: pkg.type,
          },
        },
        update: {
          quantity: {
            increment: pkg.quantity,
          },
        },
        create: {
          userId,
          type: pkg.type,
          quantity: pkg.quantity,
        },
      })

      const wallet = await tx.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BENEFIT_PACKAGE_PURCHASED',
          entity: 'USER_BENEFIT_INVENTORY',
          entityId: inventory.id,
          metadata: {
            packageId: pkg.id,
            label: pkg.label,
            type: pkg.type,
            quantity: pkg.quantity,
            totalCost: pkg.cost,
            inventoryQuantity: inventory.quantity,
            walletBalance: wallet?.balance ?? 0,
          },
        },
      })

      return {
        packageId: pkg.id,
        label: pkg.label,
        type: pkg.type,
        quantity: pkg.quantity,
        totalCost: pkg.cost,
        inventoryQuantity: inventory.quantity,
        walletBalance: wallet?.balance ?? 0,
      }
    })
  }
}
