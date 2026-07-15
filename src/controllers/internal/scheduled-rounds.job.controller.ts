import { Request, Response } from 'express'
import { OpenScheduledRoundsJobService } from '../../services/jobs/open-scheduled-rounds.job.service'
import { CloseScheduledRoundsJobService } from '../../services/jobs/close-scheduled-rounds.job.service'

export class ScheduledRoundsJobController {
  async openScheduled(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await OpenScheduledRoundsJobService.execute()
      return res.status(200).json({
        status: 'ok',
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      })
    }
  }

  async closeScheduled(_req: Request, res: Response): Promise<Response> {
    try {
      const result = await CloseScheduledRoundsJobService.execute()
      return res.status(200).json({
        status: 'ok',
        ...result,
      })
    } catch (error: any) {
      return res.status(500).json({
        error: error.message ?? 'Internal job error',
      })
    }
  }
}
