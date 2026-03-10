import { prisma } from '../../lib/prisma'
import { RoundRepository } from '../../repositories/round.repository'
import { TicketRepository } from '../../repositories/ticket.repository'
import { UserScoreHistoryRepository } from '../../repositories/user-score-history.repository'
import { SnapshotRankingService } from '../ranking/snapshot-ranking.service'
import { RoundStatus, TicketStatus } from '@prisma/client'

export class ScoreRoundService {

  private roundRepo = new RoundRepository()
  private ticketRepo = new TicketRepository()
  private historyRepo = new UserScoreHistoryRepository()

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

    const resultArray = round.result.split(',')

    await prisma.$transaction(async () => {

      for (const ticket of tickets) {

        const predictionArray = ticket.prediction.split(',')

        let scoreRound = 0

        for (let i = 0; i < predictionArray.length; i++) {

          const prediction = predictionArray[i]
          const result = resultArray[i]

          const multiplier = ticket.multipliers[i]

          const hit = prediction === result

          if (hit) {

            scoreRound += multiplier

          } else {

            if (multiplier === 2) scoreRound -= 2
            if (multiplier === 4) scoreRound -= 4

          }

        }

        await this.ticketRepo.updateScore(ticket.id, scoreRound)

        const status =
          scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST

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

    await this.recalculateRankingPositions()

    await SnapshotRankingService.execute(roundId)

  }

  private async recalculateRankingPositions() {

    const users = await prisma.userScoreHistory.findMany({
      orderBy: { scoreTotal: 'desc' }
    })

    let position = 1

    for (const user of users) {

      await prisma.rankingParticipant.updateMany({
        where: { userId: user.userId },
        data: { position }
      })

      position++

    }

  }

}