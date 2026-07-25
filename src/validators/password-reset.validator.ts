import { z } from 'zod'
import { canonicalizeEmail } from '../security/identity'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../security/password'

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email('email inválido').transform(canonicalizeEmail),
}).strict()

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'token inválido'),
  newPassword: z.string()
    .min(PASSWORD_MIN_LENGTH, `senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .max(PASSWORD_MAX_LENGTH),
}).strict()

export type RequestPasswordResetDTO = z.infer<typeof RequestPasswordResetSchema>
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>
