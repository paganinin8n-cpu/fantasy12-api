import { Request, Response } from 'express'
import { ListAdminUsersService } from '../../services/admin/list-admin-users.service'

export class ListAdminUsersController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const { page, limit, q } = req.query

    const result = await ListAdminUsersService.execute({
      page: typeof page === 'string' ? Number(page) : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
      query: typeof q === 'string' ? q : undefined,
    })

    return res.status(200).json(result)
  }
}
