import { Request, Response } from 'express'
import { ListAvailableBoloesService } from '../../services/bolao/list-available-boloes.service'
import { AppError } from '../../errors/AppError'

export class ListAvailableBoloesController {
  static async handle(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const boloes = await ListAvailableBoloesService.execute({ userId })
      return res.status(200).json(boloes)
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          details: error.details,
        })
      }

      return res.status(500).json({
        error: 'Não foi possível carregar as Mesas disponíveis agora.',
      })
    }
  }
}
