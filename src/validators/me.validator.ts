import { z } from 'zod'

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(3).max(80).optional(),
    nickname: z.string().min(2).max(40).optional(),
    phone: z.string().min(8).max(20).optional(),
    bio: z.string().max(280).optional(),
    profileImage: z.string().url().optional(),
  })
  .refine(obj => Object.keys(obj).length > 0, {
    message: 'Nenhum campo para atualizar',
  })

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPassword é obrigatório'),
    newPassword: z.string().min(6, 'nova senha deve ter ao menos 6 caracteres'),
  })

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>
