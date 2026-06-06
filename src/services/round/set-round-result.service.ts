import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'
import { normalizeRoundResult } from './round-match.types'

export class SetRoundResultService {
  static async execute(roundId: string, result: string) {
    const normalizedResult = normalizeRoundResult(result)

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: {
        status: true,
        matches: {
          orderBy: { position: 'asc' },
          select: { id: true, position: true }
        }
      }
    })

    if (!round) {
      throw new Error('Round not found')
    }

    if (round.status === RoundStatus.SCORED) {
      throw new Error('Result cannot be changed after scoring')
    }

    await prisma.$transaction(async tx => {
      await tx.round.update({
        where: { id: roundId },
        data: { result: normalizedResult.join(',') }
      })

      if (round.matches.length > 0) {
        if (round.matches.length !== 12) {
          throw new Error('A rodada precisa ter 12 jogos para salvar o resultado por partida')
        }

        for (const match of round.matches) {
          await tx.roundMatch.update({
            where: { id: match.id },
            data: {
              result: normalizedResult[match.position - 1]
            }
          })
        }
      }
    })
  }
}
