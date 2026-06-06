import { Request, Response } from 'express'
import { UpdateRoundService } from '../../services/round/update-round.service'

export class UpdateRoundController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.params
      const { openAt, closeAt, matches } = req.body

      if (!roundId) {
        return res.status(400).json({ error: 'roundId is required' })
      }

      const round = await UpdateRoundService.execute({
        roundId,
        openAt: openAt ? new Date(openAt) : undefined,
        closeAt: closeAt ? new Date(closeAt) : undefined,
        matches,
      })

      return res.status(200).json({
        status: 'ok',
        round,
      })
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Error updating round',
      })
    }
  }
}
