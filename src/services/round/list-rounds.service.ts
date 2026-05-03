import { prisma } from '../../lib/prisma'
import type { RoundStatus } from '@prisma/client'

interface Input {
  status?: RoundStatus
  limit?: number
  cursor?: string
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

/**
 * Lista rodadas paginadas (cursor-based) ordenadas pela mais recente.
 */
export class ListRoundsService {
  static async execute({ status, limit, cursor }: Input) {
    const take = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

    const items = await prisma.round.findMany({
      where: status ? { status } : undefined,
      orderBy: { number: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        number: true,
        status: true,
        openAt: true,
        closeAt: true,
        result: true,
      },
    })

    const hasMore = items.length > take
    const data = hasMore ? items.slice(0, take) : items
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return { data, nextCursor }
  }
}
