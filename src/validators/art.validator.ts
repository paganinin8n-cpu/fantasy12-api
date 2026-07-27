import { z } from 'zod'

const MAX_IMAGE_DATA_LENGTH = 2_100_000
const IMAGE_DATA_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([a-z0-9+/=\s]+)$/i

const imageDataSchema = z
  .string()
  .max(MAX_IMAGE_DATA_LENGTH, 'A imagem deve ter no máximo 1,5 MB')
  .regex(IMAGE_DATA_PATTERN, 'Use uma imagem JPEG, PNG ou WebP válida')

const dimensionsSchema = z
  .object({
    imageWidth: z.number().int().min(640).max(1600),
    imageHeight: z.number().int().min(360).max(900),
  })
  .refine(({ imageWidth, imageHeight }) => imageWidth * 9 === imageHeight * 16, {
    message: 'A imagem deve estar no formato 16:9',
    path: ['imageWidth'],
  })

const baseArtSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  published: z.boolean().optional(),
  showOnHome: z.boolean().optional(),
  sortOrder: z.number().int().min(-1000).max(1000).optional(),
})

export const CreateArtSchema = baseArtSchema
  .extend({
    imageData: imageDataSchema,
    imageWidth: z.number().int(),
    imageHeight: z.number().int(),
  })
  .and(dimensionsSchema)

export const UpdateArtSchema = baseArtSchema
  .partial()
  .extend({
    imageData: imageDataSchema.optional(),
    imageWidth: z.number().int().optional(),
    imageHeight: z.number().int().optional(),
  })
  .superRefine((value, context) => {
    const imageFields = [value.imageData, value.imageWidth, value.imageHeight]
    const suppliedFields = imageFields.filter(field => field !== undefined).length

    if (suppliedFields !== 0 && suppliedFields !== 3) {
      context.addIssue({
        code: 'custom',
        message: 'Envie a imagem, a largura e a altura juntas',
        path: ['imageData'],
      })
      return
    }

    if (
      suppliedFields === 3 &&
      (value.imageWidth! < 640 ||
        value.imageWidth! > 1600 ||
        value.imageHeight! < 360 ||
        value.imageHeight! > 900 ||
        value.imageWidth! * 9 !== value.imageHeight! * 16)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A imagem deve estar em 16:9, entre 640x360 e 1600x900',
        path: ['imageWidth'],
      })
    }
  })

export const AdminArtListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).optional(),
})

export const PublicArtListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(6),
  placement: z.enum(['all', 'home']).default('all'),
})
