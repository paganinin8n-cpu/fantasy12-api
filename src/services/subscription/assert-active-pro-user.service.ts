import { AppError } from '../../errors/AppError'
import { prisma } from '../../lib/prisma'
import { hasActiveProSubscription } from '../../domain/subscription'

export class AssertActiveProUserService {
  static async execute(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscription: {
          select: {
            status: true,
            endAt: true,
            plan: true,
          },
        },
      },
    })

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found')
    }

    if (!hasActiveProSubscription(user.subscription)) {
      throw AppError.forbidden(
        'Este recurso é exclusivo para usuários com assinatura PRO ativa.',
        'pro_subscription_required'
      )
    }

    return user
  }
}
