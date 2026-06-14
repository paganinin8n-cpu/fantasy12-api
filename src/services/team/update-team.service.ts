import { prisma } from '../../lib/prisma'
import { TeamType } from '@prisma/client'
import { NotFoundError } from '../../errors'

interface UpdateTeamInput {
  id: string
  name?: string
  shortName?: string
  country?: string
  type?: TeamType
  logoUrl?: string
  active?: boolean
}

export class UpdateTeamService {
  static async execute(input: UpdateTeamInput) {
    const exists = await prisma.team.findUnique({ where: { id: input.id } })
    if (!exists) throw new NotFoundError('Time não encontrado')

    return prisma.team.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.shortName !== undefined && { shortName: input.shortName.trim() }),
        ...(input.country !== undefined && { country: input.country.trim() }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl.trim() }),
        ...(input.active !== undefined && { active: input.active }),
      },
    })
  }
}
