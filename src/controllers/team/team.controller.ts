import { Request, Response, NextFunction } from 'express'
import { SearchTeamsService } from '../../services/team/search-teams.service'
import { CreateTeamService } from '../../services/team/create-team.service'
import { UpdateTeamService } from '../../services/team/update-team.service'
import { prisma } from '../../lib/prisma'
import { AppError } from '../../errors/AppError'

export class TeamController {
  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q ?? '').trim()
      const teams = await SearchTeamsService.execute(q)
      return res.json(teams)
    } catch (err) {
      return next(err)
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, shortName, country, type, logoUrl, externalId } = req.body
      const team = await CreateTeamService.execute({ name, shortName, country, type, logoUrl, externalId })
      return res.status(201).json(team)
    } catch (err) {
      return next(err)
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { name, shortName, country, type, logoUrl, active } = req.body
      const team = await UpdateTeamService.execute({ id, name, shortName, country, type, logoUrl, active })
      return res.json(team)
    } catch (err) {
      return next(err)
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, type, country, page = '1', limit = '50' } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {}
      if (q) where.name = { contains: String(q), mode: 'insensitive' }
      if (type) where.type = type
      if (country) where.country = { contains: String(country), mode: 'insensitive' }

      const [teams, total] = await Promise.all([
        prisma.team.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: Number(limit),
        }),
        prisma.team.count({ where }),
      ])

      return res.json({ teams, total, page: Number(page), limit: Number(limit) })
    } catch (err) {
      return next(err)
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const exists = await prisma.team.findUnique({ where: { id } })
      if (!exists) throw AppError.notFound('Time', 'team_not_found')
      await prisma.team.update({ where: { id }, data: { active: false } })
      return res.json({ ok: true })
    } catch (err) {
      return next(err)
    }
  }
}
