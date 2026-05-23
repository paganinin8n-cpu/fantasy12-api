import { z } from 'zod'

export const PurchaseBenefitsSchema = z.object({
  packageId: z.enum([
    'double_single',
    'double_combo',
    'double_total',
    'super_single',
    'super_master',
  ]),
})

export const BenefitBalanceQuerySchema = z.object({
  roundId: z.string().uuid().optional(),
})

export type PurchaseBenefitsDTO = z.infer<typeof PurchaseBenefitsSchema>
