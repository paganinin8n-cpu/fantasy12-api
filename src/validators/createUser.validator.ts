import { z } from "zod";
import { ProfileImageSchema } from './profile-image.validator'
import { canonicalizeEmail, normalizeDigits } from '../security/identity'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../security/password'
import { isAtLeastAge, parseDateOnly } from '../utils/age'

const MIN_ADULT_AGE = 18

const BirthDateSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const date = parseDateOnly(value)
    if (!date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de nascimento inválida',
      })
      return
    }

    if (date.getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de nascimento inválida',
      })
      return
    }

    if (!isAtLeastAge(date, MIN_ADULT_AGE)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'É necessário ter 18 anos ou mais para se cadastrar',
      })
    }
  })
  .transform((value) => parseDateOnly(value)!)

export const CreateUserSchema = z.object({
  name: z.string().trim().min(3).max(80),
  nickname: z.string().trim().min(2).max(40),
  email: z.string().trim().email().transform(canonicalizeEmail),
  cpf: z.string().transform(normalizeDigits).pipe(z.string().length(11)),
  phone: z.string().transform(normalizeDigits).pipe(z.string().min(10).max(15)),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  birthDate: BirthDateSchema,
  profileImage: ProfileImageSchema.optional(),
}).strict();

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
