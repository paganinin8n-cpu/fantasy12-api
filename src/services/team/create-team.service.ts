import { prisma } from '../../lib/prisma'
import { TeamType } from '@prisma/client'

interface CreateTeamInput {
  name: string
  shortName?: string
  country?: string
  type?: TeamType
  logoUrl?: string
  externalId?: string
}

export class CreateTeamService {
  static async execute(input: CreateTeamInput) {
    const team = await prisma.team.create({
      data: {
        name: input.name.trim(),
        shortName: input.shortName?.trim(),
        country: input.country?.trim(),
        type: input.type ?? 'CLUB',
        logoUrl: input.logoUrl?.trim(),
        externalId: input.externalId,
      },
    })
    return team
  }
}
