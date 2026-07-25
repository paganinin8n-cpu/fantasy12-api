import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import { revokeUserSessions } from '../../lib/redis-session-store'
import { hashPassword } from '../../security/password'

/**
 * Confirma a redefinição de senha usando o token enviado por email.
 *
 * - Verifica hash, expiração e estado (não usado).
 * - Reativa hash da senha com bcrypt.
 * - Marca token como usado dentro de uma transação para evitar replay.
 */
export class ResetPasswordService {
  static async execute({
    token,
    newPassword,
  }: {
    token: string
    newPassword: string
  }) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const result = await prisma.$transaction(async tx => {
      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      })

      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw AppError.badRequest(
          'Token de redefinição inválido ou expirado',
          'invalid_or_expired_token'
        )
      }

      const hashed = await hashPassword(newPassword)

      await tx.user.update({
        where: { id: record.userId },
        data: {
          password: hashed,
          sessionVersion: { increment: 1 },
        },
      })

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      })

      return { ok: true, userId: record.userId }
    })

    await revokeUserSessions(result.userId)
    return { ok: true }
  }
}
