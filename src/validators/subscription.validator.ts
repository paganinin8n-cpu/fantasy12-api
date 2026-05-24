import { z } from 'zod'

export const CreateSubscriptionCheckoutSchema = z.object({
  planId: z.enum(['pro_monthly', 'pro_annual_card', 'pro_annual_pix'], {
    message: 'planId inválido',
  }),
})

export type CreateSubscriptionCheckoutDTO = z.infer<
  typeof CreateSubscriptionCheckoutSchema
>
