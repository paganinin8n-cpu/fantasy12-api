import { AppError } from '../../errors/AppError'

/** Official Mesa field: Observações/Regras da premiação (maps to Ranking.description). */
export const MESA_PRIZE_RULES_MIN_LENGTH = 10
export const MESA_PRIZE_RULES_MAX_LENGTH = 500
export const MESA_PRIZE_RULES_ERROR_CODE = 'invalid_mesa_prize_rules'

/**
 * Validates and normalizes prize observations/rules for Mesa creation.
 * Legacy rows may still have null description; this only gates new creates.
 */
export function normalizeMesaPrizeRules(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw AppError.badRequest(
      'Informe as observações/regras da premiação da Mesa.',
      MESA_PRIZE_RULES_ERROR_CODE,
      { minLength: MESA_PRIZE_RULES_MIN_LENGTH, maxLength: MESA_PRIZE_RULES_MAX_LENGTH }
    )
  }

  const trimmed = raw.trim()

  if (!trimmed) {
    throw AppError.badRequest(
      'Informe as observações/regras da premiação da Mesa.',
      MESA_PRIZE_RULES_ERROR_CODE,
      { minLength: MESA_PRIZE_RULES_MIN_LENGTH, maxLength: MESA_PRIZE_RULES_MAX_LENGTH }
    )
  }

  if (trimmed.length < MESA_PRIZE_RULES_MIN_LENGTH) {
    throw AppError.badRequest(
      `As observações/regras da premiação devem ter pelo menos ${MESA_PRIZE_RULES_MIN_LENGTH} caracteres.`,
      MESA_PRIZE_RULES_ERROR_CODE,
      {
        minLength: MESA_PRIZE_RULES_MIN_LENGTH,
        maxLength: MESA_PRIZE_RULES_MAX_LENGTH,
        length: trimmed.length,
      }
    )
  }

  if (trimmed.length > MESA_PRIZE_RULES_MAX_LENGTH) {
    throw AppError.badRequest(
      `As observações/regras da premiação devem ter no máximo ${MESA_PRIZE_RULES_MAX_LENGTH} caracteres.`,
      MESA_PRIZE_RULES_ERROR_CODE,
      {
        minLength: MESA_PRIZE_RULES_MIN_LENGTH,
        maxLength: MESA_PRIZE_RULES_MAX_LENGTH,
        length: trimmed.length,
      }
    )
  }

  return trimmed
}
