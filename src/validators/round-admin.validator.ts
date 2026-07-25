import { z } from 'zod'

const NullableIsoDate = z.iso.datetime().nullable().optional()

const RoundMatchSchema = z.object({
  position: z.number().int().min(1).max(12),
  homeTeam: z.string().trim().max(120).optional(),
  awayTeam: z.string().trim().max(120).optional(),
  homeTeamId: z.uuid().nullable().optional(),
  awayTeamId: z.uuid().nullable().optional(),
  groupLabel: z.string().trim().max(40).nullable().optional(),
  matchTime: z.iso.datetime().nullable().optional(),
}).strict()

export const CreateRoundSchema = z.object({
  matches: z.array(RoundMatchSchema).length(12),
  openAt: NullableIsoDate,
  closeAt: NullableIsoDate,
}).strict()

export const UpdateRoundSchema = z.object({
  matches: z.array(RoundMatchSchema).length(12).optional(),
  openAt: NullableIsoDate,
  closeAt: NullableIsoDate,
}).strict().refine(value => Object.keys(value).length > 0, {
  message: 'informe ao menos um campo para atualização',
})

export const SetRoundResultSchema = z.object({
  result: z.string().regex(
    /^(?:1|X|2|C)(?:,(?:1|X|2|C)){11}$/i,
    'resultado deve conter exatamente 12 valores 1, X, 2 ou C'
  ),
}).strict()

export const EmptyBodySchema = z.object({}).strict()
