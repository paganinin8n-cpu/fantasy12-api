import { Request, Response, NextFunction } from 'express'
import { CreateBolaoService } from '../../services/bolao/create-bolao.service'
import { AppError } from '../../errors/AppError'
import { prisma } from '../../lib/prisma'

export class AdminBolaoController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const boloes = await prisma.ranking.findMany({
        where: { type: 'BOLAO' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          entryFee: true,
          currentParticipants: true,
          startDate: true,
          entryEndDate: true,
          endDate: true,
          prizeDistribution: true,
          grossCollected: true,
          platformFee: true,
          prizePool: true,
          settledAt: true,
          createdAt: true,
          createdByUserId: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      return res.json({ boloes })
    } catch (error) {
      return next(error)
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id

      if (!userId) {
        throw AppError.unauthorized()
      }

      const result = await CreateBolaoService.execute({
        name: req.body.name,
        description: req.body.description,
        startDate: new Date(req.body.startDate),
        entryEndDate: new Date(req.body.entryEndDate),
        endDate: new Date(req.body.endDate),
        entryFee: req.body.entryFee,
        prizeDistribution: req.body.prizeDistribution,
        createdByUserId: userId,
      })

      return res.status(201).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
