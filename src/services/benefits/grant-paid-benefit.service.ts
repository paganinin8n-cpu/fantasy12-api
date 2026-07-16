import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'

type GrantPaidBenefitInput = {
  userId: string
  roundId: string
  type: 'DOUBLE' | 'SUPER_DOUBLE'
  quantity?: number
}

/**
 * GrantPaidBenefitService
 *
 * Responsável exclusivamente por:
 * - Conceder benefícios pagos ao usuário
 *
 * Regras:
 * - NÃO debita wallet
 * - NÃO cria ticket
 * - NÃO consome benefício
 * - Apenas concede (grant)
 *
 * Uso futuro:
 * - Compra direta de benefícios
 * - Promoções
 * - Pacotes especiais
 */
export class GrantPaidBenefitService {
  static async execute({
    userId,
    roundId,
    type,
    quantity = 1,
  }: GrantPaidBenefitInput) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('quantity must be a positive integer')
    }

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const inventory = await tx.userBenefitInventory.upsert({
        where: {
          userId_type: { userId, type },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          userId,
          type,
          quantity,
        },
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: 'PAID_BENEFIT_GRANTED',
          entity: 'USER_BENEFIT_INVENTORY',
          entityId: inventory.id,
          metadata: {
            type,
            quantity,
            sourceRoundId: roundId,
            inventoryQuantity: inventory.quantity,
          },
        },
      })

      return {
        granted: type,
        quantity,
        roundId,
        sourceRoundId: roundId,
        userId,
        inventoryQuantity: inventory.quantity,
      }
    })
  }
}
