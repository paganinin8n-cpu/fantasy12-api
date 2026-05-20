import { prisma } from '../../lib/prisma'

export class FindUserByEmailService {
  static async execute(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
      },
    })
  }
}
