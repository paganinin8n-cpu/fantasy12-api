import { prisma } from '../../lib/prisma'
import { CalculateTicketScoreService } from '../score/calculate-ticket-score.service'

interface Input {
  userId: string
  limit?: number
  cursor?: string
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/**
 * Lista os tickets do usuário ordenados do mais recente para o mais antigo.
 * Pagina por cursor (ID do último item da página anterior).
 */
export class ListUserTicketsService {
  static async execute({ userId, limit, cursor }: Input) {
    const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)
    const scoreCalculator = new CalculateTicketScoreService()

    const items = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: take + 1, // +1 para detectar nextCursor
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        roundId: true,
        prediction: true,
        multipliers: true,
        status: true,
        scoreRound: true,
        createdAt: true,
        round: {
          select: {
            number: true,
            status: true,
            closeAt: true,
            result: true,
            matches: {
              select: { position: true, homeTeam: true, awayTeam: true },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    })

    const hasMore = items.length > take
    const data = hasMore ? items.slice(0, take) : items
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return {
      data: data.map(item => ({
        ...item,
        scoreBreakdown: item.round.result
          ? scoreCalculator.detail(
              item.prediction,
              item.round.result,
              item.multipliers
            )
          : null,
      })),
      nextCursor,
    }
  }
}
