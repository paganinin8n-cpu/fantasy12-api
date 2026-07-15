import { RoundStatus } from '@prisma/client'

export const COMPETITION_REGISTRATION_CLOSED =
  'As inscrições para esta competição foram encerradas.'

type LinkedRound = {
  round: {
    closeAt: Date | null
    status: RoundStatus
  }
}

type BolaoRegistrationWindow = {
  rounds: LinkedRound[]
}

export class BolaoRegistrationWindowService {
  static getFirstRound(
    bolao: BolaoRegistrationWindow
  ): LinkedRound['round'] & { closeAt: Date } {
    const firstRound = bolao.rounds[0]?.round

    if (!firstRound?.closeAt) {
      throw new Error('A Mesa não possui uma primeira rodada válida vinculada')
    }

    return { ...firstRound, closeAt: firstRound.closeAt }
  }

  static assertOpen(bolao: BolaoRegistrationWindow, now = new Date()) {
    const firstRound = this.getFirstRound(bolao)
    const closedStatuses: RoundStatus[] = [
      RoundStatus.CLOSED,
      RoundStatus.SCORED,
      RoundStatus.CANCELLED,
    ]

    if (
      closedStatuses.includes(firstRound.status) ||
      firstRound.closeAt <= now
    ) {
      throw new Error(COMPETITION_REGISTRATION_CLOSED)
    }

    return firstRound
  }
}
