import { z } from 'zod'

const PrizeDistributionItemSchema = z.object({
  position: z.number().int().positive().max(1000),
  percentage: z.number().positive().max(100),
}).strict()

export const CreateBolaoSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(2000),
  startDate: z.iso.datetime(),
  entryEndDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  entryFee: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  prizeDistribution: z.array(PrizeDistributionItemSchema).min(1).max(100),
}).strict()

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
