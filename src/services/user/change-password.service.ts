import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'

const BCRYPT_ROUNDS = 10

interface Input {
  userId: string
  currentPassword: string
  newPassword: string
}

export class ChangePasswordService {
  static async execute({ userId, currentPassword, newPassword }: Input) {
    if (newPassword.length < 6) {
      throw AppError.badRequest(
        'Nova senha deve ter ao menos 6 caracteres',
        'weak_password'
      )
    }

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

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      throw AppError.unauthorized(
        'Senha atual incorreta',
        'invalid_current_password'
      )
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    return { ok: true }
  }
}
