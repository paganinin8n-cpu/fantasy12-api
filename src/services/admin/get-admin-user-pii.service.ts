import { AppError } from '../../errors/AppError'
import { prisma } from '../../lib/prisma'

export class GetAdminUserPiiService {
  static async execute(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        cpf: true,
        phone: true,
      },
    })

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found')
    }

    return user
  }
}
