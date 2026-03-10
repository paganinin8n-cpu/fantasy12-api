import { prisma } from '../../lib/prisma'
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service'

type CreateTicketInput = {
  userId: string
  roundId: string
  prediction: string
  multipliers: number[]
}

export class CreateTicketService {

  static async execute({
    userId,
    roundId,
    prediction,
    multipliers
  }: CreateTicketInput) {

    return prisma.$transaction(async tx => {

      /**
       * 1️⃣ Validar rodada
       */
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: { status: true }
      })

      if (!round || round.status !== 'OPEN') {
        throw new Error('Round is not open')
      }

      /**
       * 2️⃣ Validar prediction
       */
      const predictions = prediction.split(',')

      if (predictions.length !== 12) {
        throw new Error('Prediction must contain 12 matches')
      }

      /**
       * 3️⃣ Validar multipliers
       */
      if (!Array.isArray(multipliers) || multipliers.length !== 12) {
        throw new Error('Multipliers must contain 12 positions')
      }

      /**
       * 4️⃣ Contar benefícios
       */
      let doubles = 0
      let superDoubles = 0

      for (const m of multipliers) {

        if (![1,2,4].includes(m)) {
          throw new Error('Invalid multiplier')
        }

        if (m === 2) doubles++
        if (m === 4) superDoubles++

      }

      /**
       * 5️⃣ Consumir benefícios
       */
      if (doubles > 0) {
        await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: 'DOUBLE',
          quantity: doubles
        })
      }

      if (superDoubles > 0) {
        await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: 'SUPER_DOUBLE',
          quantity: superDoubles
        })
      }

      /**
       * 6️⃣ Criar ticket
       */
      const ticket = await tx.ticket.create({
        data: {
          userId,
          roundId,
          prediction,
          multipliers
        }
      })

      return {
        id: ticket.id,
        roundId: ticket.roundId,
        createdAt: ticket.createdAt
      }

    })

  }

}