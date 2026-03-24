import { prisma } from '../../lib/prisma'
import { RoundRepository } from '../../repositories/round.repository'
import { TicketRepository } from '../../repositories/ticket.repository'
import { UserScoreHistoryRepository } from '../../repositories/user-score-history.repository'
import { CalculateTicketScoreService } from '../score/calculate-ticket-score.service'
import { RoundStatus, TicketStatus } from '@prisma/client'

export class ScoreRoundService {

  private roundRepo = new RoundRepository()
  private ticketRepo = new TicketRepository()
  private historyRepo = new UserScoreHistoryRepository()
  private scoreCalculator = new CalculateTicketScoreService()

  async execute(roundId: string): Promise<void> {

    const round = await this.roundRepo.findById(roundId)

    if (!round) {
      throw new Error('Rodada não encontrada')
    }

    if (round.status === RoundStatus.SCORED) {
      throw new Error('Rodada já apurada (SCORED)')
    }

    if (round.status !== RoundStatus.CLOSED) {
      throw new Error('Rodada não está fechada para apuração')
    }

    if (!round.result) {
      throw new Error('Resultado da rodada não informado')
    }

    const result = round.result as string

    const tickets = await this.ticketRepo.findByRound(roundId)

    await prisma.$transaction(async (tx) => {

      for (const ticket of tickets) {

        /**
         * 🔒 IDPOTÊNCIA
         */
        if (ticket.scoreRound > 0) continue

        const scoreRound = this.scoreCalculator.execute(
          ticket.prediction,
          result,
          ticket.multipliers
        )

        await tx.ticket.update({
          where: { id: ticket.id },
          data: { scoreRound }
        })

        const status =
          scoreRound > 0
            ? TicketStatus.WON
            : TicketStatus.LOST

        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status }
        })

        const lastHistory =
          await this.historyRepo.findLastByUser(ticket.userId)

        const lastTotal =
          lastHistory ? lastHistory.scoreTotal : 0

        await tx.userScoreHistory.create({
          data: {
            userId: ticket.userId,
            roundId,
            scoreRound,
            scoreTotal: lastTotal + scoreRound
          }
        })

      }

      await tx.round.update({
        where: { id: roundId },
        data: { status: RoundStatus.SCORED }
      })

    })

  }

}