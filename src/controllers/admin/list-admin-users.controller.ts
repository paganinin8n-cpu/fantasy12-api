import { NextFunction, Request, Response } from 'express'
import { ListAdminUsersService } from '../../services/admin/list-admin-users.service'
import { AdminUserManagementService } from '../../services/admin/admin-user-management.service'
import { GetAdminUserHistoryService } from '../../services/admin/get-admin-user-history.service'
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client'

export class ListAdminUsersController {
  static async handle(req: Request, res: Response): Promise<Response> {
    const { page, limit, q, query } = req.query

    const result = await ListAdminUsersService.execute({
      page: typeof page === 'string' ? Number(page) : undefined,
      limit: typeof limit === 'string' ? Number(limit) : undefined,
      query:
        typeof q === 'string'
          ? q
          : typeof query === 'string'
            ? query
            : undefined,
    })

    return res.status(200).json(result)
  }

  static async block(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const result = await AdminUserManagementService.blockUser(
        {
          adminUserId: (req as any).user.id,
          ipAddress: req.ip,
        },
        req.params.userId,
        String(req.body.reason ?? '')
      )

      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }

  static async history(req: Request, res: Response): Promise<Response> {
    const result = await GetAdminUserHistoryService.execute(req.params.userId)
    return res.status(200).json(result)
  }

  static async unblock(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const result = await AdminUserManagementService.unblockUser(
        {
          adminUserId: (req as any).user.id,
          ipAddress: req.ip,
        },
        req.params.userId,
        String(req.body.reason ?? '')
      )

      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }

  static async setSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const result = await AdminUserManagementService.setManualSubscription(
        {
          adminUserId: (req as any).user.id,
          ipAddress: req.ip,
        },
        req.params.userId,
        {
          plan: req.body.plan as SubscriptionPlan,
          status: req.body.status as SubscriptionStatus,
          startAt: new Date(req.body.startAt),
          endAt: req.body.endAt ? new Date(req.body.endAt) : null,
          reason: String(req.body.reason ?? ''),
        }
      )

      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }

  static async cancelSubscription(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const result = await AdminUserManagementService.cancelManualSubscription(
        {
          adminUserId: (req as any).user.id,
          ipAddress: req.ip,
        },
        req.params.userId,
        String(req.body.reason ?? '')
      )

      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }
}
