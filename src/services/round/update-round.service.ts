import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'
import type { RoundMatchInput } from './round-match.types'
import { normalizeRoundMatches } from './round-match.types'
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

      const normalizedMatches = normalizeRoundMatches(matches ?? round.matches)
      const schedule = OfficialRoundScheduleService.resolve(normalizedMatches, {
        openAt,
        closeAt,
      })

      await tx.round.update({
        where: { id: roundId },
        data: { openAt: schedule.openAt, closeAt: schedule.closeAt },
      })

      if (matches) {

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
