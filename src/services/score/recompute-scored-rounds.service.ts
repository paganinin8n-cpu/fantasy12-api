import { RoundStatus, TicketStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { RecalculateRankingService } from '../ranking/recalculate-ranking.service'
import { SnapshotRankingService } from '../ranking/snapshot-ranking.service'
import { CalculateTicketScoreService } from './calculate-ticket-score.service'

type RecomputeScoredRoundsResult = {
  roundsProcessed: number
  ticketsProcessed: number
  historiesRebuilt: number
  snapshotsRebuilt: number
}

/**
 * Reconstroi pontuacao, historico e snapshots das rodadas ja apuradas.
 *
 * Uso operacional apos ajuste de regra de score:
 * - remove historicos/snapshots das rodadas SCORED
 * - recalcula tickets em ordem cronologica de rodada
 * - recria acumulados e snapshots com a regra atual
 */
export class RecomputeScoredRoundsService {
  static async execute(): Promise<RecomputeScoredRoundsResult> {
    const calculator = new CalculateTicketScoreService()

    const rounds = await prisma.round.findMany({
      where: {
        status: RoundStatus.SCORED,
        result: { not: null },
      },
      orderBy: [{ number: 'asc' }, { createdAt: 'asc' }],
      include: {
        tickets: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const roundIds = rounds.map(round => round.id)

    if (roundIds.length === 0) {
      return {
        roundsProcessed: 0,
        ticketsProcessed: 0,
        historiesRebuilt: 0,
        snapshotsRebuilt: 0,
      }
    }

    await prisma.rankingSnapshot.deleteMany({
      where: { roundId: { in: roundIds } },
    })

    await prisma.userScoreHistory.deleteMany({
      where: { roundId: { in: roundIds } },
    })

    await prisma.user.updateMany({
      data: { scoreTotal: 0 },
    })

    let ticketsProcessed = 0
    let historiesRebuilt = 0
    let snapshotsRebuilt = 0

    for (const round of rounds) {
      const result = round.result
      if (!result) continue

      await prisma.$transaction(async tx => {
        for (const ticket of round.tickets) {
          const breakdown = calculator.detail(
            ticket.prediction,
            result,
            ticket.multipliers
          )

          const scoreRound = breakdown.total

          const updatedUser = await tx.user.update({
            where: { id: ticket.userId },
            data: { scoreTotal: { increment: scoreRound } },
            select: { scoreTotal: true },
          })

          const lastHistory = await tx.userScoreHistory.findFirst({
            where: { userId: ticket.userId },
            orderBy: [{ createdAt: 'desc' }, { scoreTotal: 'desc' }],
            select: { scoreTotal: true, totalDoubles: true, totalSuperDoubles: true },
          })

          await tx.ticket.update({
            where: { id: ticket.id },
            data: {
              scoreRound,
              status: scoreRound > 0 ? TicketStatus.WON : TicketStatus.LOST,
            },
          })

          await tx.userScoreHistory.create({
            data: {
              userId: ticket.userId,
              roundId: round.id,
              scoreRound,
              scoreTotal: updatedUser.scoreTotal,
              totalDoubles: (lastHistory?.totalDoubles ?? 0) + breakdown.doubleHits,
              totalSuperDoubles: (lastHistory?.totalSuperDoubles ?? 0) + breakdown.superDoubleHits,
            },
          })

          ticketsProcessed += 1
          historiesRebuilt += 1
        }
      })

      await SnapshotRankingService.execute(round.id)
      snapshotsRebuilt += 1
    }

    await RecalculateRankingService.execute()

    return {
      roundsProcessed: rounds.length,
      ticketsProcessed,
      historiesRebuilt,
      snapshotsRebuilt,
    }
  }
}
