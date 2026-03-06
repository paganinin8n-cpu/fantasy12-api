import { Request, Response } from 'express'
import { SetRoundResultService } from '../../services/round/set-round-result.service'

export class SetRoundResultController {
  static async handle(req: Request, res: Response): Promise<Response> {
    try {
      const { roundId } = req.params
      const { result } = req.body

      if (!roundId) {
        return res.status(400).json({ error: 'roundId is required' })
      }

      if (!result) {
        return res.status(400).json({ error: 'result is required' })
      }

      await SetRoundResultService.execute(roundId, result)

      return res.status(200).json({
        status: 'ok',
        message: 'Round result set successfully'
      })

    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Error setting result'
      })
    }
  }
}