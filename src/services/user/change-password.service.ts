import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import { revokeUserSessions } from '../../lib/redis-session-store'
import {
  assertPasswordPolicy,
  hashPassword,
  verifyPassword,
} from '../../security/password'

interface Input {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordService {
  static async execute({ userId, currentPassword, newPassword }: Input) {
    assertPasswordPolicy(newPassword)

    if (currentPassword === newPassword) {
      throw AppError.badRequest(
        'Nova senha deve ser diferente da atual',
        'same_password'
      )
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found')
    }

    const valid = await verifyPassword(currentPassword, user.password)
    if (!valid) {
      throw AppError.unauthorized(
        'Senha atual incorreta',
        'invalid_current_password'
      )
    }

    const hashed = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashed,
        sessionVersion: { increment: 1 },
      },
    })

    await revokeUserSessions(userId)
    return { ok: true }
  }
}
