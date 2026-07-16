import { RoundStatus } from '@prisma/client'

export const COMPETITION_REGISTRATION_CLOSED =
  'As inscrições para esta competição foram encerradas.'
export const COMPETITION_REGISTRATION_NOT_STARTED =
  'As inscrições para esta competição ainda não começaram.'

type LinkedRound = {
  round: {
    closeAt: Date | null
    status: RoundStatus
  }
}

type BolaoRegistrationWindow = {
  startDate?: Date | null
  entryEndDate?: Date | null
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

  static assertNotClosed(bolao: BolaoRegistrationWindow, now = new Date()) {
    const firstRound = this.getFirstRound(bolao)
    const closedStatuses: RoundStatus[] = [
      RoundStatus.CLOSED,
      RoundStatus.SCORED,
      RoundStatus.CANCELLED,
    ]

    if (
      closedStatuses.includes(firstRound.status) ||
      firstRound.closeAt <= now ||
      (bolao.entryEndDate != null && bolao.entryEndDate <= now)
    ) {
      throw new Error(COMPETITION_REGISTRATION_CLOSED)
    }

    return firstRound
  }

  static assertOpen(bolao: BolaoRegistrationWindow, now = new Date()) {
    if (bolao.startDate != null && bolao.startDate > now) {
      throw new Error(COMPETITION_REGISTRATION_NOT_STARTED)
    }

    return this.assertNotClosed(bolao, now)
  }
}
