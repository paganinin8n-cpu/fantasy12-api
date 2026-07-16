import { Request, Response, NextFunction } from 'express'
import { CreateBolaoService } from '../../services/bolao/create-bolao.service'
import { AppError } from '../../errors/AppError'

export class CreateBolaoController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const result = await CreateBolaoService.execute({
        name: req.body.name,
        description: req.body.description,
        startDate: new Date(req.body.startDate),
        entryEndDate: new Date(req.body.entryEndDate),
        endDate: new Date(req.body.endDate),
        entryFee: req.body.entryFee ? Number(req.body.entryFee) : 0,
        prizeDistribution: req.body.prizeDistribution,
        createdByUserId: userId,
      })

      return res.status(201).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
