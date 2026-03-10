import { prisma } from '../../lib/prisma'
import { WalletService } from '../wallet/wallet.service'
import { BENEFIT_COST, PaidBenefitType } from './benefits.config'
import { Prisma } from '@prisma/client'

type ConsumeInput = {
  userId: string
  roundId: string
  type: PaidBenefitType
  quantity?: number
}

export class ConsumeBenefitsService {

  static async execute({
    userId,
    roundId,
    type,
    quantity = 1
  }: ConsumeInput) {

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      let remaining = quantity

      /**
       * 1️⃣ CONSUMIR BENEFÍCIOS FREE DA RODADA
       */

      const benefit = await tx.roundBenefit.findUnique({
        where: { userId_roundId: { userId, roundId } }
      })

      if (!benefit) {
        throw new Error('Round benefits not found')
      }

      if (type === 'DOUBLE' && benefit.freeDoubles > 0) {

        const used = Math.min(benefit.freeDoubles, remaining)

        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeDoubles: { decrement: used }
          }
        })

        remaining -= used

      }

      if (type === 'SUPER_DOUBLE' && benefit.freeSuperDoubles > 0) {

        const used = Math.min(benefit.freeSuperDoubles, remaining)

        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeSuperDoubles: { decrement: used }
          }
        })

        remaining -= used

      }

      /**
       * 2️⃣ CONSUMIR INVENTÁRIO
       */

      if (remaining > 0) {

        const inventory = await tx.userBenefitInventory.findUnique({
          where: {
            userId_type: {
              userId,
              type
            }
          }
        })

        if (inventory && inventory.quantity > 0) {

          const used = Math.min(inventory.quantity, remaining)

          await tx.userBenefitInventory.update({
            where: { id: inventory.id },
            data: {
              quantity: { decrement: used }
            }
          })

          remaining -= used

        }

      }

      /**
       * 3️⃣ CONSUMIR COINS
       */

      if (remaining > 0) {

        const cost = BENEFIT_COST[type] * remaining

        await WalletService.debit(
          userId,
          cost,
          `Consume ${remaining} ${type} on round ${roundId}`,
          tx
        )

        return {
          consumed: 'PAID',
          quantity,
          cost
        }

      }

      return {
        consumed: 'FREE_OR_INVENTORY',
        quantity
      }

    })

  }

}