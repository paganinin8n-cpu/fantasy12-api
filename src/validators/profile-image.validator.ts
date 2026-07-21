import { z } from 'zod'

const MAX_PROFILE_IMAGE_LENGTH = 200_000
const DATA_IMAGE_PATTERN = /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i

export const ProfileImageSchema = z
  .string()
  .max(MAX_PROFILE_IMAGE_LENGTH, 'A foto do perfil é muito grande')
  .refine(value => {
    if (DATA_IMAGE_PATTERN.test(value)) return true
    try {
      const url = new URL(value)
      return url.protocol === 'https:' || url.protocol === 'http:'
    } catch {
      return false
    }
  }, 'Foto do perfil inválida')
