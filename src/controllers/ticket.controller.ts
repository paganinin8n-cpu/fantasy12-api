import { Request, Response, NextFunction } from 'express'
import { CreateTicketService } from '../services/ticket/create-ticket.service'
import { GetCurrentTicketService } from '../services/ticket/get-current-ticket.service'
import { ListUserTicketsService } from '../services/ticket/list-user-tickets.service'
import { AppError } from '../errors/AppError'

export class TicketController {
  static async current(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id ?? req.session?.user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const ticket = await GetCurrentTicketService.execute({ userId })

      return res.status(200).json(ticket)
    } catch (err) {
      return next(err)
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id ?? req.session?.user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const cursor = (req.query.cursor as string | undefined) ?? undefined

      const result = await ListUserTicketsService.execute({
        userId,
        limit,
        cursor,
      })

      return res.status(200).json(result)
    } catch (err) {
      return next(err)
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id ?? req.session?.user?.id
      const { roundId, prediction, multipliers } = req.body

      if (!userId) {
        throw AppError.unauthorized()
      }

      const ticket = await CreateTicketService.execute({
        userId,
        roundId,
        prediction,
        multipliers,
      })

      return res.status(201).json(ticket)
    } catch (error) {
      return next(error)
    }
  }
}
