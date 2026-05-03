import { Request, Response, NextFunction } from 'express'
import { ListRoundsService } from '../../services/round/list-rounds.service'
import type { RoundStatus } from '@prisma/client'

const VALID_STATUSES: RoundStatus[] = [
  'DRAFT',
  'PENDING',
  'OPEN',
  'CLOSED',
  'SCORED',
  'CANCELLED',
]

export class ListRoundsController {
  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const statusParam = req.query.status as string | undefined
      const status =
        statusParam && VALID_STATUSES.includes(statusParam as RoundStatus)
          ? (statusParam as RoundStatus)
          : undefined

      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const cursor = (req.query.cursor as string | undefined) ?? undefined

      const result = await ListRoundsService.execute({ status, limit, cursor })
      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }
}
