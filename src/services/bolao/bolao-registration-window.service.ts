export const COMPETITION_REGISTRATION_CLOSED =
  'As inscrições para esta competição foram encerradas.'
export const COMPETITION_REGISTRATION_NOT_STARTED =
  'As inscrições para esta competição ainda não começaram.'

type BolaoRegistrationWindow = {
  startDate?: Date | null
  entryEndDate?: Date | null
}

/**
 * Janela de inscrição da Mesa baseada apenas nas datas da própria Mesa.
 * Não depende mais de rodada vinculada.
 */
export class BolaoRegistrationWindowService {
  static assertNotClosed(bolao: BolaoRegistrationWindow, now = new Date()) {
    if (bolao.entryEndDate != null && bolao.entryEndDate <= now) {
      throw new Error(COMPETITION_REGISTRATION_CLOSED)
    }
  }

  static assertOpen(bolao: BolaoRegistrationWindow, now = new Date()) {
    if (bolao.startDate != null && bolao.startDate > now) {
      throw new Error(COMPETITION_REGISTRATION_NOT_STARTED)
    }

    this.assertNotClosed(bolao, now)
  }

  /** Marco de baseline de pontuação: início da Mesa (fallback: agora). */
  static baselineAt(bolao: Pick<BolaoRegistrationWindow, 'startDate'>, now = new Date()) {
    return bolao.startDate ?? now
  }
}
