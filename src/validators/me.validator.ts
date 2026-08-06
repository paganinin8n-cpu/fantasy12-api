import { z } from 'zod'
import { ProfileImageSchema } from './profile-image.validator'
import { normalizeDigits } from '../security/identity'
import { NewPasswordSchema } from './password.schema'

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
    newPassword: NewPasswordSchema,
  }).strict()

export const UpdateUserPreferencesSchema = z
  .object({
    proUpsellDisabled: z.boolean(),
  })
  .strict()

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>
export type UpdateUserPreferencesDTO = z.infer<typeof UpdateUserPreferencesSchema>
