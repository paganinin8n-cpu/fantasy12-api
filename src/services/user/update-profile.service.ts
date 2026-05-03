import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'
import { Prisma } from '@prisma/client'

interface Input {
  userId: string
  data: {
    name?: string
    nickname?: string
    phone?: string
    bio?: string
    profileImage?: string
  }
}

/**
 * Atualiza dados de perfil do usuário autenticado.
 * Campos sensíveis (email, cpf, role, password) NÃO são editáveis aqui.
 */
export class UpdateProfileService {
  static async execute({ userId, data }: Input) {
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.nickname !== undefined && { nickname: data.nickname }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.profileImage !== undefined && {
            profileImage: data.profileImage,
          }),
        },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          phone: true,
          bio: true,
          profileImage: true,
          role: true,
        },
      })

      return updated
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw AppError.conflict(
          'Apelido já está em uso',
          'nickname_already_taken'
        )
      }
      throw err
    }
  }
}
