import { z } from 'zod'

const PrizeDistributionItemSchema = z.object({
  position: z.number().int().positive().max(1000),
  percentage: z.number().positive().max(100),
}).strict()

const CreateMesaBaseSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(2000),
  startDate: z.iso.datetime(),
  entryEndDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  accessCost: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  entryFee: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional(),
  prizeDistribution: z.array(PrizeDistributionItemSchema).min(1).max(100),
}).strict()

export const CreateMesaSchema = CreateMesaBaseSchema.superRefine((input, ctx) => {
  if (input.accessCost == null && input.entryFee == null) {
    ctx.addIssue({
      code: 'custom',
      path: ['accessCost'],
      message: 'Informe o custo de acesso da Mesa',
    })
  }

  if (
    input.accessCost != null &&
    input.entryFee != null &&
    input.accessCost !== input.entryFee
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['accessCost'],
      message: 'accessCost e entryFee devem possuir o mesmo valor durante a compatibilidade',
    })
  }
})

/** @deprecated Use CreateMesaSchema. */
export const CreateBolaoSchema = CreateMesaSchema

export const ReviewBolaoRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
}).strict()

export const CreateBolaoInviteSchema = z.object({
  maxUses: z.number().int().positive().max(10000).optional(),
  expiresAt: z.iso.datetime().optional(),
}).strict()

export const RankingParticipantParamsSchema = z.object({
  rankingId: z.uuid(),
  participantId: z.uuid(),
}).strict()

export const InviteCodeParamsSchema = z.object({
  code: z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
}).strict()
