import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

class SubscriptionController {
  static async get(req: Request, res: Response) {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    })

    if (!subscription) {
      return res.status(200).json({
        isPro: false,
        subscription: null,
      })
    }

    const isPro =
      subscription.status === 'ACTIVE' &&
      (!subscription.endAt || subscription.endAt > new Date())

    return res.status(200).json({
      isPro,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        startAt: subscription.startAt.toISOString(),
        endAt: subscription.endAt?.toISOString() ?? null,
      },
    })
  }
}

export default SubscriptionController
