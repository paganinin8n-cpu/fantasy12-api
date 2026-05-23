import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { AppError } from '../errors/AppError'
import { PurchaseBenefitsService } from '../services/benefits/purchase-benefits.service'
import { GetBenefitBalanceService } from '../services/benefits/get-benefit-balance.service'

export class BenefitsController {
  static async balance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized()

      const data = await GetBenefitBalanceService.execute(
        req.user.id,
        req.query.roundId as string | undefined
      )

      return res.status(200).json(data)
    } catch (err) {
      return next(err)
    }
  }

  static async purchase(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized()

      const data = await PurchaseBenefitsService.execute({
        userId: req.user.id,
        packageId: req.body.packageId,
      })

      return res.status(201).json(data)
    } catch (err) {
      return next(err)
    }
  }
}
