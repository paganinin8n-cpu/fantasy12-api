import { z } from 'zod'
import { getPasswordPolicyError } from '../security/password'

/** Senha nova (cadastro, reset, troca). Não usar no login. */
export const NewPasswordSchema = z.string().superRefine((value, ctx) => {
  const error = getPasswordPolicyError(value)
  if (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error,
    })
  }
})
