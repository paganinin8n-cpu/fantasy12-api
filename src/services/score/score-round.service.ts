import { prisma } from '../../lib/prisma'
import { RoundStatus, TicketStatus } from '@prisma/client'
import { CalculateTicketScoreService } from './calculate-ticket-score.service'
import { RecalculateRankingService } from '../ranking/recalculate-ranking.service'
import { SnapshotRankingService } from '../ranking/snapshot-ranking.service'

export class ScoreRoundService {

  private calculator = new CalculateTicketScoreService()

  async execute(roundId: string): Promise<void> {

    await prisma.$transaction(async (tx) => {

      const round = await tx.round.findUnique({
        where: { id: roundId },
        include: {
          tickets: true
        }
      })

      if (!round) {
        throw new Error('Rodada não encontrada')
      }

      /**
       * idempotência
       */
      if (round.status === RoundStatus.SCORED) {
        return
      }

      if (round.status !== RoundStatus.CLOSED) {
        throw new Error('Somente rodadas CLOSED podem ser apuradas')
      }

      if (!round.result) {
        throw new Error('Resultado da rodada não definido')
      }

      for (const ticket of round.tickets) {

        const scoreRound = this.calculator.execute(
          ticket.prediction,
          round.result,
          ticket.multipliers
        )

        const status =
          scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST

        /**
         * atualizar ticket
         */
        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            scoreRound,
            status
          }
        })

        /**
         * buscar último histórico
         */
        const lastHistory = await tx.userScoreHistory.findFirst({
          where: { userId: ticket.userId },
          orderBy: { scoreTotal: 'desc' }
        })

        const previousTotal = lastHistory?.scoreTotal ?? 0

        const scoreTotal = previousTotal + scoreRound

        /**
         * inserir histórico
         */
        await tx.userScoreHistory.create({
          data: {
            userId: ticket.userId,
            roundId,
            scoreRound,
            scoreTotal
          }
        })

      }

      /**
       * finalizar rodada
       */
      await tx.round.update({
        where: { id: roundId },
        data: {
          status: RoundStatus.SCORED
        }
      })

    })

    /**
     * 🔥 atualizar ranking
     */
    await RecalculateRankingService.execute()

    /**
     * 📸 gerar snapshot
     */
    await SnapshotRankingService.execute(roundId)

  }

}