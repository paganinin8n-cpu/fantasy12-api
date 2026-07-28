import { prisma } from '../../lib/prisma'
import { TeamType } from '@prisma/client'
import { AppError } from '../../errors/AppError'

interface UpdateTeamInput {
  id: string
  name?: string
  shortName?: string | null
  country?: string | null
  type?: TeamType
  logoUrl?: string | null
  active?: boolean
}

function normalizeOptionalText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export class UpdateTeamService {
  static async execute(input: UpdateTeamInput) {
    const exists = await prisma.team.findUnique({ where: { id: input.id } })
    if (!exists) throw AppError.notFound('Time', 'team_not_found')

    return prisma.team.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.shortName !== undefined && {
          shortName: normalizeOptionalText(input.shortName),
        }),
        ...(input.country !== undefined && {
          country: normalizeOptionalText(input.country),
        }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.logoUrl !== undefined && {
          logoUrl: normalizeOptionalText(input.logoUrl),
        }),
        ...(input.active !== undefined && { active: input.active }),
      },
    })
  }
}
