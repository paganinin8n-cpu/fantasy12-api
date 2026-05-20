import { Request, Response } from 'express'
import { ListAvailableBoloesService } from '../../services/bolao/list-available-boloes.service'

export class ListAvailableBoloesController {
  static async handle(req: Request, res: Response) {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const boloes = await ListAvailableBoloesService.execute({ userId })
    return res.status(200).json(boloes)
  }
}
