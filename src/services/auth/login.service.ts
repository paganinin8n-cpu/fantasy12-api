import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import { canonicalizeEmail } from '../../security/identity'
import { verifyPassword } from '../../security/password'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutos

interface LoginInput {
  email?: string
  password?: string
}

/**
 * Login com proteção contra brute force por conta:
 *
 * - Cada falha incrementa `failedLoginAttempts`.
 * - Ao atingir MAX_FAILED_ATTEMPTS, conta fica bloqueada por LOCKOUT_MS.
 * - Login bem-sucedido zera os contadores.
 *
 * Mensagens são genéricas para não vazar quais emails existem.
 */
export class LoginService {
  static async execute({ email, password }: LoginInput) {
    if (!email || !password) {
      throw AppError.unauthorized('Credenciais inválidas', 'invalid_credentials')
    }

    const user = await prisma.user.findUnique({
      where: { email: canonicalizeEmail(email) },
    })

    if (!user) {
      throw AppError.unauthorized('Credenciais inválidas', 'invalid_credentials')
    }

    if (user.adminBlockedAt) {
      throw AppError.forbidden(
        'Conta bloqueada administrativamente. Entre em contato com o suporte.',
        'account_admin_blocked'
      )
    }

    // Conta bloqueada?
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw AppError.unauthorized(
        'Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em alguns minutos.',
        'account_locked'
      )
    }

    const validPassword = await verifyPassword(password, user.password)

    if (!validPassword) {
      const lockUntil = new Date(Date.now() + LOCKOUT_MS)
      await prisma.$queryRaw(Prisma.sql`
        UPDATE "users"
        SET
          "failedLoginAttempts" = "failedLoginAttempts" + 1,
          "lockedUntil" = CASE
            WHEN "failedLoginAttempts" + 1 >= ${MAX_FAILED_ATTEMPTS}
              THEN ${lockUntil}
            ELSE "lockedUntil"
          END,
          "updatedAt" = NOW()
        WHERE "id" = ${user.id}
      `)

      throw AppError.unauthorized('Credenciais inválidas', 'invalid_credentials')
    }

    // Zera contadores no sucesso
    if (user.failedLoginAttempts !== 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      })
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        sessionVersion: user.sessionVersion,
      },
    }
  }
}
