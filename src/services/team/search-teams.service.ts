import { prisma } from '../../lib/prisma'

export class SearchTeamsService {
  static async execute(query: string, limit = 10) {
    const q = String(query ?? '').trim()

    const teams = await prisma.team.findMany({
      where: {
        active: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { shortName: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        country: true,
        type: true,
        logoUrl: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    })

    return teams
  }
}
