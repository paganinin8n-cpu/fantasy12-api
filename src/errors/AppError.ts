/**
 * Erro de domínio com código semântico, status HTTP e detalhes opcionais.
 *
 * O `code` é a chave estável que o frontend pode usar para tratar
 * casos específicos sem depender da mensagem (que pode ser i18n).
 *
 * Exemplo de uso:
 *   throw new AppError('Saldo insuficiente', 'insufficient_balance', 400, { available: 0 })
 *   throw AppError.notFound('Rodada', 'round_not_found')
 *   throw AppError.unauthorized()
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>

  constructor(
    message: string,
    codeOrStatus: string | number = 'app_error',
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(message)

    // Retrocompatibilidade: `new AppError('msg', 404)` continua válido.
    if (typeof codeOrStatus === 'number') {
      this.statusCode = codeOrStatus
      this.code = 'app_error'
    } else {
      this.statusCode = statusCode
      this.code = codeOrStatus
    }

    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }

  static badRequest(
    message: string,
    code: string = 'bad_request',
    details?: Record<string, unknown>
  ) {
    return new AppError(message, code, 400, details)
  }

  static unauthorized(
    message: string = 'Não autenticado',
    code: string = 'unauthorized'
  ) {
    return new AppError(message, code, 401)
  }

  static forbidden(
    message: string = 'Acesso negado',
    code: string = 'forbidden'
  ) {
    return new AppError(message, code, 403)
  }

  static notFound(
    resource: string = 'Recurso',
    code: string = 'not_found'
  ) {
    return new AppError(`${resource} não encontrado`, code, 404)
  }

  static conflict(message: string, code: string = 'conflict') {
    return new AppError(message, code, 409)
  }

  static internal(
    message: string = 'Erro interno do servidor',
    code: string = 'internal_error'
  ) {
    return new AppError(message, code, 500)
  }
}
