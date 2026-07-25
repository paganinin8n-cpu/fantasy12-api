import { z } from 'zod'

const PositiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

export const AdminWalletMutationSchema = z.object({
  amount: PositiveSafeInteger,
  reason: z.string().trim().min(3).max(500),
}).strict()

export const AdminFreeBenefitMutationSchema = z.object({
  roundId: z.uuid(),
  type: z.enum(['DOUBLE', 'SUPER_DOUBLE']),
  amount: PositiveSafeInteger,
}).strict()

export const AdminPaidBenefitMutationSchema = z.object({
  type: z.enum(['DOUBLE', 'SUPER_DOUBLE']),
  amount: PositiveSafeInteger,
}).strict()

export const AdminBenefitQuerySchema = z.object({
  roundId: z.uuid().optional(),
}).strict()
