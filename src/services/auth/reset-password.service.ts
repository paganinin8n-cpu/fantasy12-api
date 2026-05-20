import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import { PasswordResetTokenService } from './password-reset-token.service'

const BCRYPT_ROUNDS = 10

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
    if (newPassword.length < 6) {
      throw AppError.badRequest(
        'Senha deve ter ao menos 6 caracteres',
        'weak_password'
      )
    }

    try {
      const decoded = PasswordResetTokenService.verify(token)
      const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashed },
      })

      return { ok: true }
    } catch (statelessErr) {
      // Se não for um token JWT válido de reset, continua no fluxo legado.
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    return prisma.$transaction(async tx => {
      const record = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
      })

      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw AppError.badRequest(
          'Token de redefinição inválido ou expirado',
          'invalid_or_expired_token'
        )
      }

      const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

      await tx.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      })

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      })

      return { ok: true }
    })
  }
}
