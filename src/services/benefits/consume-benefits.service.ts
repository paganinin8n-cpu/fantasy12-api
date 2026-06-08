import { prisma } from '../../lib/prisma'
import { PaidBenefitType } from './benefits.config'
import { Prisma } from '@prisma/client'
import { AppError } from '../../errors/AppError'

type ConsumeInput = {
  userId: string
  roundId: string
  type: PaidBenefitType
  quantity?: number
  tx?: Prisma.TransactionClient
}

export class ConsumeBenefitsService {

  static async execute({
    userId,
    roundId,
    type,
    quantity = 1,
    tx
  }: ConsumeInput) {
    const run = async (client: Prisma.TransactionClient) => {
      let remaining = quantity
      let freeUsed = 0
      let inventoryUsed = 0

      const benefit = await client.roundBenefit.findUnique({
        where: { userId_roundId: { userId, roundId } }
      })

      if (!benefit) {
        throw new Error('Round benefits not found')
      }

      if (type === 'DOUBLE' && benefit.freeDoubles > 0) {

        const used = Math.min(benefit.freeDoubles, remaining)

        await client.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeDoubles: { decrement: used }
          }
        })

        remaining -= used
        freeUsed += used

      }

      if (type === 'SUPER_DOUBLE' && benefit.freeSuperDoubles > 0) {

        const used = Math.min(benefit.freeSuperDoubles, remaining)

        await client.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeSuperDoubles: { decrement: used }
          }
        })

        remaining -= used
        freeUsed += used

      }

      /**
       * 2️⃣ CONSUMIR INVENTÁRIO
       */

      if (remaining > 0) {

        const inventory = await client.userBenefitInventory.findUnique({
          where: {
            userId_type: {
              userId,
              type
            }
          }
        })

        if (inventory && inventory.quantity > 0) {

          const used = Math.min(inventory.quantity, remaining)

          await client.userBenefitInventory.update({
            where: { id: inventory.id },
            data: {
              quantity: { decrement: used }
            }
          })

          remaining -= used
          inventoryUsed += used

        }

      }

      if (remaining > 0) {
        throw AppError.badRequest(
          'Saldo de benefícios insuficiente',
          'insufficient_benefit_balance',
          {
            type,
            requested: quantity,
            missing: remaining,
          }
        )
      }

      return {
        consumed: 'FREE_OR_INVENTORY',
        quantity,
        freeUsed,
        inventoryUsed,
      }
    }

    if (tx) return run(tx)

    return prisma.$transaction(async (client: Prisma.TransactionClient) => run(client))

  }

}
