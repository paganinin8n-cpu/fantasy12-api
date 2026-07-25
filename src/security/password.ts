import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { AppError } from '../errors/AppError'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
const BCRYPT_ROUNDS = 10
const SHA256_BCRYPT_PREFIX = '$f12-sha256$'

export function assertPasswordPolicy(password: string): void {
  if (
    typeof password !== 'string'
    || password.length < PASSWORD_MIN_LENGTH
    || password.length > PASSWORD_MAX_LENGTH
  ) {
    throw AppError.badRequest(
      `Senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres`,
      'weak_password'
    )
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
