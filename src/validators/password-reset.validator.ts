import { z } from 'zod'
import { canonicalizeEmail } from '../security/identity'
import { NewPasswordSchema } from './password.schema'

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email('email inválido').transform(canonicalizeEmail),
}).strict()

export const ResetPasswordSchema = z.object({
  token: z.string().min(10, 'token inválido'),
  newPassword: NewPasswordSchema,
}).strict()

export type RequestPasswordResetDTO = z.infer<typeof RequestPasswordResetSchema>
export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>
