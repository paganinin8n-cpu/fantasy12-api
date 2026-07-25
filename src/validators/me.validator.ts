import { z } from 'zod'
import { ProfileImageSchema } from './profile-image.validator'
import { normalizeDigits } from '../security/identity'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../security/password'

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(3).max(80).optional(),
    nickname: z.string().min(2).max(40).optional(),
    phone: z.string().transform(normalizeDigits).pipe(z.string().min(10).max(15)).optional(),
    bio: z.string().max(280).optional(),
    profileImage: ProfileImageSchema.nullable().optional(),
  }).strict()
  .refine(obj => Object.keys(obj).length > 0, {
    message: 'Nenhum campo para atualizar',
  })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPassword é obrigatório'),
    newPassword: z.string()
      .min(PASSWORD_MIN_LENGTH, `nova senha deve ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`)
      .max(PASSWORD_MAX_LENGTH),
  }).strict()

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>
