import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('email inválido'),
  password: z.string().min(1, 'password é obrigatório'),
})

export type LoginDTO = z.infer<typeof LoginSchema>
