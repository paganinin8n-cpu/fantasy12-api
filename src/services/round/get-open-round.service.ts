import { prisma } from '../../lib/prisma'
import { RoundStatus } from '@prisma/client'

export class GetOpenRoundService {
  static async execute() {
    const round = await prisma.round.findFirst({
      where: {
        status: RoundStatus.OPEN
      },
      orderBy: {
        number: 'desc'
      }
    })

    return round
  }
}