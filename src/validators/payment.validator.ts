import { z } from 'zod'

export const CreatePaymentSchema = z.object({
  packageId: z.string().min(1, 'packageId é obrigatório'),
  method: z.enum(['PIX', 'CARD'], {
    message: 'method deve ser PIX ou CARD',
  }),
})

export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>
