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
        durationDays: Number(req.body.durationDays),
        maxParticipants: req.body.maxParticipants
          ? Number(req.body.maxParticipants)
          : undefined,
        createdByUserId: userId,
      })

      return res.status(201).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
