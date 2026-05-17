import { prisma } from '../../lib/prisma'

interface Input {
  userId: string
}

export class GetCurrentTicketService {
  static async execute({ userId }: Input) {
    const openRound = await prisma.round.findFirst({
      where: { status: 'OPEN' },
      select: { id: true },
      orderBy: { number: 'desc' },
    })

    if (!openRound) return null

    return prisma.ticket.findUnique({
      where: {
        userId_roundId: {
          userId,
          roundId: openRound.id,
        },
      },
      select: {
        id: true,
        roundId: true,
        prediction: true,
        multipliers: true,
        status: true,
        scoreRound: true,
        createdAt: true,
      },
    })
  }
}
