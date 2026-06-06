import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'
import type { RoundMatchInput } from './round-match.types'
import { normalizeRoundMatches } from './round-match.types'

type UpdateRoundInput = {
  roundId: string
  openAt?: Date
  closeAt?: Date
  matches?: RoundMatchInput[]
}

export class UpdateRoundService {
  static async execute({ roundId, openAt, closeAt, matches }: UpdateRoundInput) {
    return prisma.$transaction(async tx => {
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          status: true,
          openAt: true,
          closeAt: true,
        },
      })

      if (!round) {
        throw new Error('Rodada não encontrada')
      }

      if (round.status !== RoundStatus.DRAFT) {
        throw new Error('Somente rodadas em rascunho podem ser editadas')
      }

      const nextOpenAt = openAt ?? round.openAt
      const nextCloseAt = closeAt ?? round.closeAt

      if (nextOpenAt && nextCloseAt && nextOpenAt >= nextCloseAt) {
        throw new Error('openAt deve ser anterior a closeAt')
      }

      const data: { openAt?: Date; closeAt?: Date } = {}
      if (openAt) data.openAt = openAt
      if (closeAt) data.closeAt = closeAt

      if (Object.keys(data).length > 0) {
        await tx.round.update({
          where: { id: roundId },
          data,
        })
      }

      if (matches) {
        const normalizedMatches = normalizeRoundMatches(matches)

        await tx.roundMatch.deleteMany({
          where: { roundId },
        })

        await tx.roundMatch.createMany({
          data: normalizedMatches.map(match => ({
            ...match,
            roundId,
          })),
        })
      }

      return tx.round.findUniqueOrThrow({
        where: { id: roundId },
        include: {
          matches: {
            orderBy: { position: 'asc' },
          },
        },
      })
    })
  }
}
