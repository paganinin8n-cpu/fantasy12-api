import { Request, Response } from 'express'
import { ListAdminLogsService } from '../../services/admin/list-admin-logs.service'

export class ListAdminLogsController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const { entity, entityId, action, source, userId, limit } = req.query as any

    const result = await ListAdminLogsService.execute({
      entity,
      entityId,
      action,
      source,
      userId,
      limit,
    })

    return res.status(200).json(result)
  }
}
