import { Request, Response } from 'express'
import { ListAdminLogsService } from '../../services/admin/list-admin-logs.service'

export class ListAdminLogsController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const { entity, entityId, action, source, userId, limit } = req.query

    const result = await ListAdminLogsService.execute({
      entity: typeof entity === 'string' ? entity : undefined,
      entityId: typeof entityId === 'string' ? entityId : undefined,
      action: typeof action === 'string' ? action : undefined,
      source:
        source === 'audit' || source === 'admin' || source === 'all'
          ? source
          : undefined,
      userId: typeof userId === 'string' ? userId : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
    })

    return res.status(200).json(result)
  }
}
