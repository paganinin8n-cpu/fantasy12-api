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
      let inventoryAvailable = 0

      const benefit = await client.roundBenefit.findUnique({
        where: { userId_roundId: { userId, roundId } }
      })

      if (type === 'DOUBLE' && benefit && benefit.freeDoubles > 0) {

        const used = Math.min(benefit.freeDoubles, remaining)

        const debit = await client.roundBenefit.updateMany({
          where: { id: benefit.id, freeDoubles: { gte: used } },
          data: {
            freeDoubles: { decrement: used }
          }
        })

        if (debit.count === 1) {
          remaining -= used
          freeUsed += used
        }

      }

      if (type === 'SUPER_DOUBLE' && benefit && benefit.freeSuperDoubles > 0) {

        const used = Math.min(benefit.freeSuperDoubles, remaining)

        const debit = await client.roundBenefit.updateMany({
          where: { id: benefit.id, freeSuperDoubles: { gte: used } },
          data: {
            freeSuperDoubles: { decrement: used }
          }
        })

        if (debit.count === 1) {
          remaining -= used
          freeUsed += used
        }

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
        inventoryAvailable = inventory?.quantity ?? 0

        if (inventory && inventory.quantity >= remaining) {
          const debit = await client.userBenefitInventory.updateMany({
            where: { id: inventory.id, quantity: { gte: remaining } },
            data: {
              quantity: { decrement: remaining }
            }
          })

          if (debit.count === 1) {
            inventoryUsed += remaining
            remaining = 0
          }

        }

      }

      if (remaining > 0) {
        throw AppError.badRequest(
          'Saldo de benefícios insuficiente',
          'insufficient_benefit_balance',
          {
            type,
            requested: quantity,
            missing: Math.max(remaining - inventoryAvailable, 0),
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
