import { Request, Response } from 'express'
import { CreateRoundService } from '../../services/round/create-round.service'

export class CreateRoundController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { openAt, closeAt } = req.body

      if (!openAt || !closeAt) {
        return res.status(400).json({
          error: 'openAt and closeAt are required'
        })
      }

      const service = new CreateRoundService()

      const round = await service.execute({
        openAt: new Date(openAt),
        closeAt: new Date(closeAt)
      })

      return res.status(201).json({
        status: 'ok',
        round
      })

    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Error creating round'
      })
    }
  }
}