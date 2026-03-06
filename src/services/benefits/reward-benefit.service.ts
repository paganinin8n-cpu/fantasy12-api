import { prisma } from '../../lib/prisma'
import { BetType } from '@prisma/client'

type RewardInput = {
  userId: string
  type: BetType
  quantity: number
  reason?: string
}

export class RewardBenefitService {
  static async execute({
    userId,
    type,
    quantity,
  }: RewardInput) {

    const existing = await prisma.userBenefitInventory.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    })

    if (!existing) {
      return prisma.userBenefitInventory.create({
        data: {
          userId,
          type,
          quantity,
        },
      })
    }

    return prisma.userBenefitInventory.update({
      where: { id: existing.id },
      data: {
        quantity: {
          increment: quantity,
        },
      },
    })
  }
}