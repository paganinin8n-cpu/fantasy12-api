import { Request, Response } from 'express'
import { OpenRoundService } from '../../services/round/open-round.service'

export class OpenRoundController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.params

      if (!roundId) {
        return res.status(400).json({
          error: 'roundId is required'
        })
      }

      await OpenRoundService.execute(roundId)

      return res.status(200).json({
        status: 'ok',
        message: 'Round opened successfully'
      })

    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Error opening round'
      })
    }
  }
}