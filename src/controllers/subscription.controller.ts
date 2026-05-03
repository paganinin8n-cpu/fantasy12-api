import { Request, Response, NextFunction } from 'express'
import { GetSubscriptionStatusService } from '../services/subscription/get-subscription-status.service'
import { CancelSubscriptionService } from '../services/subscription/cancel-subscription.service'
import { AppError } from '../errors/AppError'

class SubscriptionController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session?.user?.id ?? (req as any).user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const result = await GetSubscriptionStatusService.execute(userId)
      return res.status(200).json(result)
    } catch (error) {
      return next(error)
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session?.user?.id ?? (req as any).user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const subscription = await CancelSubscriptionService.execute({ userId })
      return res.status(200).json(subscription)
    } catch (error) {
      return next(error)
    }
  }
}

export default SubscriptionController
