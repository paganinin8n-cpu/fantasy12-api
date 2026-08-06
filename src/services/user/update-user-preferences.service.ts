import { prisma } from '../../lib/prisma'

type Input = {
  userId: string
  proUpsellDisabled: boolean
}

export class UpdateUserPreferencesService {
  static async execute({ userId, proUpsellDisabled }: Input) {
    return prisma.user.update({
      where: { id: userId },
      data: { proUpsellDisabled },
      select: { proUpsellDisabled: true },
    })
  }
}
