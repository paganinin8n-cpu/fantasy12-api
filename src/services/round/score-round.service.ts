import { prisma } from '../../lib/prisma'
import { RoundRepository } from '../../repositories/round.repository'
import { TicketRepository } from '../../repositories/ticket.repository'
import { UserScoreHistoryRepository } from '../../repositories/user-score-history.repository'
import { SnapshotRankingService } from '../ranking/snapshot-ranking.service'
import { RecalculateRankingService } from '../ranking/recalculate-ranking.service'
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

    const tickets = await this.ticketRepo.findByRound(roundId)

    await prisma.$transaction(async () => {

      for (const ticket of tickets) {

        const scoreRound = this.scoreCalculator.execute(
          ticket.prediction,
          round.result,
          ticket.multipliers
        )

        await this.ticketRepo.updateScore(ticket.id, scoreRound)

        const status =
          scoreRound > 0
            ? TicketStatus.WON
            : TicketStatus.LOST

        await this.ticketRepo.updateStatus(ticket.id, status)

        const lastHistory =
          await this.historyRepo.findLastByUser(ticket.userId)

        const lastTotal =
          lastHistory ? lastHistory.scoreTotal : 0

        await this.historyRepo.create({
          userId: ticket.userId,
          roundId,
          scoreRound,
          scoreTotal: lastTotal + scoreRound
        })

      }

      await this.roundRepo.updateStatus(
        roundId,
        RoundStatus.SCORED
      )

    })

    /**
     * recalcula ranking oficial
     */
    await RecalculateRankingService.execute()

    /**
     * gera snapshot da rodada
     */
    await SnapshotRankingService.execute(roundId)

  }

}