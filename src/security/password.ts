import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { AppError } from '../errors/AppError'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/** Texto curto para placeholders / dicas de UI. */
export const PASSWORD_POLICY_HINT =
  'Mín. 8 caracteres, com maiúscula, minúscula e número'

const BCRYPT_ROUNDS = 10
const SHA256_BCRYPT_PREFIX = '$f12-sha256$'

/**
 * Política canônica de senha (cadastro, reset e troca).
 * Login NÃO usa isto — senhas antigas precisam continuar autenticando.
 */
export function getPasswordPolicyError(password: unknown): string | null {
  if (typeof password !== 'string') {
    return `Senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres, com letra maiúscula, minúscula e número`
  }

  if (
    password.length < PASSWORD_MIN_LENGTH
    || password.length > PASSWORD_MAX_LENGTH
  ) {
    return `Senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres, com letra maiúscula, minúscula e número`
  }

  if (!/\p{Ll}/u.test(password)) {
    return 'Senha deve incluir pelo menos uma letra minúscula'
  }

  if (!/\p{Lu}/u.test(password)) {
    return 'Senha deve incluir pelo menos uma letra maiúscula'
  }

  if (!/\d/.test(password)) {
    return 'Senha deve incluir pelo menos um número'
  }

  return null
}

export function assertPasswordPolicy(password: string): void {
  const error = getPasswordPolicyError(password)
  if (error) {
    throw AppError.badRequest(error, 'weak_password')
  }
}

function passwordDigest(password: string): string {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password)
  const hash = await bcrypt.hash(passwordDigest(password), BCRYPT_ROUNDS)
  return `${SHA256_BCRYPT_PREFIX}${hash}`
}

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (storedHash.startsWith(SHA256_BCRYPT_PREFIX)) {
    return bcrypt.compare(
      passwordDigest(password),
      storedHash.slice(SHA256_BCRYPT_PREFIX.length)
    )
  }

  // Compatibilidade com hashes bcrypt criados antes da política canônica.
  return bcrypt.compare(password, storedHash)
}
