import { Request, Response } from 'express'
import { CreateRoundService } from '../../services/round/create-round.service'

export class CreateRoundController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { matches, openAt, closeAt } = req.body

      if (!Array.isArray(matches)) {
        return res.status(400).json({
          error: 'matches are required; schedule is derived from matchTime'
        })
      }

      const service = new CreateRoundService()

      const round = await service.execute({
        matches,
        openAt,
        closeAt,
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
