import { z } from 'zod'
import { canonicalizeEmail } from '../security/identity'
import { PASSWORD_MAX_LENGTH } from '../security/password'

export const LoginSchema = z.object({
  email: z.string().trim().email('email inválido').transform(canonicalizeEmail),
  password: z.string().min(1, 'password é obrigatório').max(PASSWORD_MAX_LENGTH),
}).strict()

export type LoginDTO = z.infer<typeof LoginSchema>
