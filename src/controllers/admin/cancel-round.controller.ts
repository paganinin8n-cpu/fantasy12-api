import { Request, Response } from 'express'
import { RoundAdminService } from '../../services/round/round-admin.service'

export class CancelRoundController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.params

      if (!roundId) {
        return res.status(400).json({
          error: 'roundId is required',
        })
      }

      const service = new RoundAdminService()
      await service.cancelRound(roundId)

      return res.status(200).json({
        status: 'ok',
        message: 'Round cancelled successfully',
      })
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Error cancelling round',
      })
    }
  }
}
