import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'
import type { RoundMatchInput } from './round-match.types'
import { normalizeRoundMatches, resolveRoundMatchTeams } from './round-match.types'
import { OfficialRoundScheduleService } from './official-round-schedule.service'

type UpdateRoundInput = {
  roundId: string
  matches?: RoundMatchInput[]
  openAt?: Date | string | null
  closeAt?: Date | string | null
}

export class UpdateRoundService {
  static async execute({ roundId, matches, openAt, closeAt }: UpdateRoundInput) {
    return prisma.$transaction(async tx => {
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          status: true,
          openAt: true,
          closeAt: true,
          matches: { orderBy: { position: 'asc' } },
        },
      })

      if (!round) {
        throw new Error('Rodada não encontrada')
      }

      if (round.status !== RoundStatus.DRAFT) {
        throw new Error('Somente rodadas em rascunho podem ser editadas')
      }

      if (matches) {
        const resolvedMatches = await resolveRoundMatchTeams(matches)
        const schedule = OfficialRoundScheduleService.resolve(resolvedMatches, {
          openAt,
          closeAt,
        })

        await tx.round.update({
          where: { id: roundId },
          data: { openAt: schedule.openAt, closeAt: schedule.closeAt },
        })

        await tx.roundMatch.deleteMany({
          where: { roundId },
        })

        await tx.roundMatch.createMany({
          data: resolvedMatches.map(match => ({
            ...match,
            roundId,
          })),
        })
      } else {
        const schedule = OfficialRoundScheduleService.resolve(
          normalizeRoundMatches(round.matches),
          { openAt, closeAt }
        )

        await tx.round.update({
          where: { id: roundId },
          data: { openAt: schedule.openAt, closeAt: schedule.closeAt },
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
