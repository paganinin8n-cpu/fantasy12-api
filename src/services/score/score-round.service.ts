import { prisma } from '../../lib/prisma'
import { RoundStatus, TicketStatus } from '@prisma/client'
import { CalculateTicketScoreService } from './calculate-ticket-score.service'
import { RecalculateRankingService } from '../ranking/recalculate-ranking.service'
import { SnapshotRankingService } from '../ranking/snapshot-ranking.service'

export class ScoreRoundService {

  private calculator = new CalculateTicketScoreService()

  async execute(roundId: string): Promise<void> {

    const scored = await prisma.$transaction(async (tx) => {

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
        return false
      }

      if (round.status !== RoundStatus.CLOSED) {
        throw new Error('Somente rodadas CLOSED podem ser apuradas')
      }

      if (!round.result) {
        throw new Error('Resultado da rodada não definido')
      }

      for (const ticket of round.tickets) {

        const breakdown = this.calculator.detail(
          ticket.prediction,
          round.result,
          ticket.multipliers
        )

        const scoreRound = breakdown.total
        const status = scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST

        await tx.ticket.update({
          where: { id: ticket.id },
          data: { scoreRound, status }
        })

        const lastHistory = await tx.userScoreHistory.findFirst({
          where: { userId: ticket.userId },
          orderBy: [
            { round: { number: 'desc' } },
            { createdAt: 'desc' },
          ],
          select: {
            scoreTotal: true,
            totalDoubles: true,
            totalSuperDoubles: true,
          },
        })

        await tx.userScoreHistory.create({
          data: {
            userId: ticket.userId,
            roundId,
            scoreRound,
            scoreTotal: (lastHistory?.scoreTotal ?? 0) + scoreRound,
            totalDoubles: (lastHistory?.totalDoubles ?? 0) + breakdown.doubleHits,
            totalSuperDoubles: (lastHistory?.totalSuperDoubles ?? 0) + breakdown.superDoubleHits,
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

      return true

    })

    if (!scored) return

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
