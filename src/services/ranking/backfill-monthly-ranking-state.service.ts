import { TicketStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { CalculateTicketScoreService } from '../score/calculate-ticket-score.service'
import { SnapshotRankingService } from './snapshot-ranking.service'

type BackfillResult = {
  roundsScanned: number
  historyCreated: number
  snapshotsCreated: number
}

export class BackfillMonthlyRankingStateService {
  static async execute(): Promise<BackfillResult> {
    const calculator = new CalculateTicketScoreService()
    const rounds = await prisma.round.findMany({
      where: {
        status: 'SCORED',
      },
      orderBy: {
        number: 'asc',
      },
      include: {
        tickets: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    let historyCreated = 0
    let snapshotsCreated = 0

    for (const round of rounds) {
      if (!round.result) {
        continue
      }

      for (const ticket of round.tickets) {
        const existingHistory = await prisma.userScoreHistory.findUnique({
          where: {
            userId_roundId: {
              userId: ticket.userId,
              roundId: round.id,
            },
          },
          select: { id: true },
        })

        if (existingHistory) {
          continue
        }

        const scoreRound =
          typeof ticket.scoreRound === 'number'
            ? ticket.scoreRound
            : calculator.execute(ticket.prediction, round.result, ticket.multipliers)

        await prisma.$transaction(async tx => {
          const updatedUser = await tx.user.update({
            where: { id: ticket.userId },
            data: { scoreTotal: { increment: scoreRound } },
            select: { scoreTotal: true },
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
            },
          })
        })

        historyCreated += 1
      }

      const snapshotExists = await prisma.rankingSnapshot.findFirst({
        where: { roundId: round.id },
        select: { id: true },
      })

      if (!snapshotExists) {
        await SnapshotRankingService.execute(round.id)
        snapshotsCreated += 1
      }
    }

    return {
      roundsScanned: rounds.length,
      historyCreated,
      snapshotsCreated,
    }
  }
}
