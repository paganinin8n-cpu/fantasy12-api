import { Request, Response } from 'express'
import { GetRoundMatchesService } from '../../services/match/get-round-matches.service'

export class GetRoundMatchesController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {

      const { roundId } = req.params

      if (!roundId) {
        return res.status(400).json({
          error: 'roundId is required'
        })
      }

      const matches = await GetRoundMatchesService.execute(roundId)

      return res.json(matches)

    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Error fetching matches'
      })
    }
  }
}