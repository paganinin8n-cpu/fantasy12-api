import { prisma } from '../../lib/prisma'

export class GetRoundMatchesService {
  static async execute(roundId: string) {
    const matches = await prisma.match.findMany({
      where: {
        roundId
      },
      orderBy: {
        position: 'asc'
      }
    })

    return matches
  }
}