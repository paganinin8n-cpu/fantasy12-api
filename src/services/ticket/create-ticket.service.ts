import { prisma } from '../../lib/prisma'
import { ConsumeBenefitsService } from '../benefits/consume-benefits.service'
import { BetType } from '@prisma/client'
import { AppError } from '../../errors/AppError'

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
        select: {
          status: true,
          openAt: true,
          closeAt: true,
        }
      })

      if (!round) {
        throw AppError.badRequest(
          'A rodada não está aberta para receber palpites.',
          'round_not_open'
        )
      }

      const now = new Date()

      if (round.status !== 'OPEN') {
        if (round.openAt && now < round.openAt) {
          throw AppError.badRequest(
            'A rodada ainda não abriu para palpites.',
            'round_not_open_yet'
          )
        }

        throw AppError.badRequest(
          'A rodada não está aberta para receber palpites.',
          'round_not_open'
        )
      }

      if (round.closeAt && now >= round.closeAt) {
        throw AppError.badRequest(
          'O prazo para palpites encerrou.',
          'round_predictions_closed'
        )
      }

      /**
       * 2️⃣ Validar prediction
       */
      const predictions = prediction.split(',')

      if (predictions.length !== 12) {
        throw AppError.badRequest(
          'O envio precisa conter os 12 jogos da rodada.',
          'invalid_prediction_size'
        )
      }

      /**
       * 3️⃣ Validar multipliers
       */
      if (!Array.isArray(multipliers) || multipliers.length !== 12) {
        throw AppError.badRequest(
          'Os multiplicadores precisam informar as 12 posições.',
          'invalid_multiplier_size'
        )
      }

      /**
       * 4️⃣ Contar benefícios
       */
      let doubles = 0
      let superDoubles = 0

      for (const m of multipliers) {

        if (![1,2,4].includes(m)) {
          throw AppError.badRequest(
            'Foi encontrado um multiplicador inválido no envio.',
            'invalid_multiplier'
          )
        }

        if (m === 2) doubles++
        if (m === 4) superDoubles++

      }

      const existingTicket = await tx.ticket.findUnique({
        where: {
          userId_roundId: {
            userId,
            roundId,
          },
        },
        select: { id: true },
      })

      if (existingTicket) {
        throw AppError.conflict(
          'Você já enviou seus palpites para esta rodada.',
          'ticket_already_exists'
        )
      }

      /**
       * 5️⃣ Consumir benefícios
       */
      const benefitConsumption: Array<{
        type: BetType
        quantity: number
        freeUsed: number
        inventoryUsed: number
      }> = []

      if (doubles > 0) {
        const consumption = await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: BetType.DOUBLE,
          quantity: doubles,
          tx,
        })
        benefitConsumption.push({
          type: BetType.DOUBLE,
          quantity: doubles,
          freeUsed: consumption.freeUsed,
          inventoryUsed: consumption.inventoryUsed,
        })
      }

      if (superDoubles > 0) {
        const consumption = await ConsumeBenefitsService.execute({
          userId,
          roundId,
          type: BetType.SUPER_DOUBLE,
          quantity: superDoubles,
          tx,
        })
        benefitConsumption.push({
          type: BetType.SUPER_DOUBLE,
          quantity: superDoubles,
          freeUsed: consumption.freeUsed,
          inventoryUsed: consumption.inventoryUsed,
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

      await tx.auditLog.create({
        data: {
          userId,
          action: 'TICKET_SUBMITTED',
          entity: 'TICKET',
          entityId: ticket.id,
          metadata: {
            roundId,
            prediction,
            multipliers,
            doubles,
            superDoubles,
            benefitConsumption,
          },
        },
      })

      return {
        id: ticket.id,
        roundId: ticket.roundId,
        createdAt: ticket.createdAt
      }

    })

  }

}
