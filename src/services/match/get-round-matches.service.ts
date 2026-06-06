import { prisma } from '../../lib/prisma'

export class GetRoundMatchesService {
  static async execute(roundId: string) {
    return prisma.roundMatch.findMany({
      where: { roundId },
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
    })
  }
}
