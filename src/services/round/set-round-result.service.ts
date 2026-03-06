import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'

export class SetRoundResultService {
  static async execute(roundId: string, result: string) {
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { status: true }
    })

    if (!round) {
      throw new Error('Round not found')
    }

    if (round.status === RoundStatus.SCORED) {
      throw new Error('Result cannot be changed after scoring')
    }

    await prisma.round.update({
      where: { id: roundId },
      data: { result }
    })
  }
}