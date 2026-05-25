import { Request, Response } from 'express'
import { GetOperationalStatusService } from '../../services/admin/get-operational-status.service'

export class OperationalStatusController {
  static async handle(_req: Request, res: Response): Promise<Response> {
    const status = await GetOperationalStatusService.execute()
    return res.status(200).json(status)
  }
}
