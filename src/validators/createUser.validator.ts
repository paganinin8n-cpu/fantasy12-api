import { z } from "zod";
import { ProfileImageSchema } from './profile-image.validator'
import { canonicalizeEmail, normalizeDigits } from '../security/identity'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../security/password'

export const CreateUserSchema = z.object({
  name: z.string().trim().min(3).max(80),
  nickname: z.string().trim().min(2).max(40),
  email: z.string().trim().email().transform(canonicalizeEmail),
  cpf: z.string().transform(normalizeDigits).pipe(z.string().length(11)),
  phone: z.string().transform(normalizeDigits).pipe(z.string().min(10).max(15)),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  profileImage: ProfileImageSchema.optional(),
}).strict();

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
