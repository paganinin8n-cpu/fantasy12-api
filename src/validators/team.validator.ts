import { z } from 'zod'

const TeamFields = {
  name: z.string().trim().min(2).max(120),
  shortName: z.string().trim().min(1).max(20).nullable().optional(),
  country: z.string().trim().min(2).max(80).nullable().optional(),
  type: z.enum(['CLUB', 'NATIONAL']),
  logoUrl: z.url().max(2048).nullable().optional(),
}

export const CreateTeamSchema = z.object({
  ...TeamFields,
  externalId: z.string().trim().min(1).max(120).nullable().optional(),
}).strict()

export const UpdateTeamSchema = z.object({
  name: TeamFields.name.optional(),
  shortName: TeamFields.shortName,
  country: TeamFields.country,
  type: TeamFields.type.optional(),
  logoUrl: TeamFields.logoUrl,
  active: z.boolean().optional(),
}).strict().refine(value => Object.keys(value).length > 0, {
  message: 'informe ao menos um campo para atualização',
})

export const AdminTeamListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  type: z.enum(['CLUB', 'NATIONAL']).optional(),
  country: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict()
