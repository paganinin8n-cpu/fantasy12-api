import { Request, Response, NextFunction } from 'express'
import { CreateBolaoService } from '../../services/bolao/create-bolao.service'
import { AppError } from '../../errors/AppError'
import { prisma } from '../../lib/prisma'
import { withMesaFinancialNames } from '../../services/bolao/mesa-financial-names'
import { MesaIntegrityService } from '../../services/bolao/mesa-integrity.service'

export class AdminBolaoController {
  static async integrity(_req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(await MesaIntegrityService.diagnose(prisma))
    } catch (error) {
      return next(error)
    }
  }

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
          accessCost: true,
          category: true,
          sponsorPrizePool: true,
          maxParticipants: true,
          currentParticipants: true,
          startDate: true,
          entryEndDate: true,
          endDate: true,
          prizeDistribution: true,
          grossCollected: true,
          platformFee: true,
          prizePool: true,
          rewardPool: true,
          settledAt: true,
          createdAt: true,
          createdByUserId: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      const mesas = boloes.map(withMesaFinancialNames)
      return res.json({ mesas, boloes: mesas })
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
        endDate: new Date(req.body.endDate),
        category: req.body.category,
        accessCost: req.body.accessCost,
        entryFee: req.body.entryFee,
        sponsorPrizePool: req.body.sponsorPrizePool,
        maxParticipants: req.body.maxParticipants,
        prizeDistribution: req.body.prizeDistribution,
        createdByUserId: userId,
      })

      return res.status(201).json(result)
    } catch (error) {
      return next(error)
    }
  }
}
