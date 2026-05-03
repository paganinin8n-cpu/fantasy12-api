import { Request, Response, NextFunction } from 'express'
import { ListUserBoloesService } from '../../services/bolao/list-user-boloes.service'
import { AppError } from '../../errors/AppError'

export class ListUserBoloesController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.session?.user?.id ?? (req as any).user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const boloes = await ListUserBoloesService.execute({ userId })
      return res.status(200).json(boloes)
    } catch (err) {
      return next(err)
    }
  }
}
