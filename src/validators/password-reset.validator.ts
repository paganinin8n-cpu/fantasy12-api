import { z } from 'zod'

export const RequestPasswordResetSchema = z.object({
  email: z.string().email('email inválido'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'token inválido'),
  newPassword: z.string().min(6, 'senha deve ter ao menos 6 caracteres'),
})

export type RequestPasswordResetDTO = z.infer<typeof RequestPasswordResetSchema>
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>
