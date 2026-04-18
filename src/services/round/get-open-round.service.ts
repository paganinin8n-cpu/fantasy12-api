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
      },
      select: {
        id: true,
        number: true,
        status: true,
        openAt: true,
        closeAt: true,
        result: true
      }
    })

    if (!round) {
      return null
    }

    // O sistema atual nao possui tabela de jogos/partidas.
    // Mantemos o contrato explicito para o frontend ativo.
    return {
      id: round.id,
      number: round.number,
      status: round.status,
      openAt: round.openAt,
      closeAt: round.closeAt,
      result: round.result,
      matches: []
    }
  }
}
