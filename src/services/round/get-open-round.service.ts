import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'

export class GetOpenRoundService {
  static async execute() {
    const now = new Date()

    const round = await prisma.round.findFirst({
      where: {
        status: RoundStatus.OPEN,
        OR: [
          { closeAt: null },
          { closeAt: { gt: now } },
        ],
      },
      orderBy: {
        number: 'desc'
      },
      select: {
        id: true,
        number: true,
        status: true,
        openAt: true,
        closeAt: true,
        result: true,
        matches: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            position: true,
            homeTeam: true,
            awayTeam: true,
            groupLabel: true,
            matchTime: true,
            result: true
          }
        }
      }
    })

    if (!round) {
      return null
    }

    return {
      id: round.id,
      number: round.number,
      status: round.status,
      openAt: round.openAt,
      closeAt: round.closeAt,
      result: round.result,
      matches: round.matches
    }
  }
}
