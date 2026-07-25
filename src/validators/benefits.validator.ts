import { z } from 'zod'

export const PurchaseBenefitsSchema = z.object({
  packageId: z.enum([
    'double_single',
    'double_combo',
    'double_total',
    'super_single',
    'super_master',
  ]),
}).strict()

export const BenefitBalanceQuerySchema = z.object({
  roundId: z.string().uuid().optional(),
}).strict()

export type PurchaseBenefitsDTO = z.infer<typeof PurchaseBenefitsSchema>
