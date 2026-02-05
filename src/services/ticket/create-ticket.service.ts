import { prisma } from '../../lib/prisma'
import { BetType } from '@prisma/client'
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service'

type CreateTicketInput = {
  userId: string
  roundId: string
  prediction: string
  betType?: BetType
}

export class CreateTicketService {
  static async execute({
    userId,
    roundId,
    prediction,
    betType = BetType.NONE,
  }: CreateTicketInput) {
    return prisma.$transaction(async tx => {
      /**
       * 1️⃣ Validar rodada
       */
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: { status: true },
      })

      if (!round || round.status !== 'OPEN') {
        throw new Error('Round is not open')
      }

      /**
       * 2️⃣ Consumir benefício (FREE → PAID)
       */
      let betMultiplier = 1

      if (betType !== BetType.NONE) {
        await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: betType,
        })

        betMultiplier = betType === BetType.DOUBLE ? 2 : 4
      }

      /**
       * 3️⃣ Criar ticket (IMUTÁVEL)
       */
      const ticket = await tx.ticket.create({
        data: {
          userId,
          roundId,
          prediction,
          betType,
          betMultiplier,
        },
      })

      return {
        id: ticket.id,
        roundId: ticket.roundId,
        betType: ticket.betType,
        betMultiplier: ticket.betMultiplier,
        createdAt: ticket.createdAt,
      }
    })
  }
}
