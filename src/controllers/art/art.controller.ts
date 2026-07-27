import { Request, Response } from 'express'
import { AppError } from '../../errors/AppError'
import { prisma } from '../../lib/prisma'

const artSelect = {
  id: true,
  title: true,
  description: true,
  imageWidth: true,
  imageHeight: true,
  published: true,
  showOnHome: true,
  sortOrder: true,
  likeCount: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const

function toDto<T extends { id: string }>(art: T) {
  return {
    ...art,
    imageUrl: `/api/arts/${art.id}/image`,
  }
}

function parseImage(imageData: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/is.exec(imageData)
  if (!match) throw AppError.badRequest('Imagem inválida', 'invalid_art_image')

  return {
    imageMime: match[1].toLowerCase(),
    imageData: match[2].replace(/\s/g, ''),
  }
}

export class ArtController {
  static async publicList(req: Request, res: Response) {
    const limit = Number(req.query.limit) || 6
    const homeOnly = req.query.placement === 'home'
    const arts = await prisma.art.findMany({
      where: { published: true, ...(homeOnly ? { showOnHome: true } : {}) },
      select: artSelect,
      orderBy: [{ sortOrder: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    return res.json(arts.map(toDto))
  }

  static async image(req: Request, res: Response) {
    const art = await prisma.art.findUnique({
      where: { id: req.params.id },
      select: { imageData: true, imageMime: true, updatedAt: true },
    })
    if (!art) throw AppError.notFound('Arte', 'art_not_found')

    res.set({
      'Content-Type': art.imageMime,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Last-Modified': art.updatedAt.toUTCString(),
    })
    return res.send(Buffer.from(art.imageData, 'base64'))
  }

  static async adminList(req: Request, res: Response) {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.art.findMany({
        where,
        select: artSelect,
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.art.count({ where }),
    ])

    return res.json({ items: items.map(toDto), total, page, limit })
  }

  static async create(req: Request, res: Response) {
    const {
      imageData,
      title,
      description,
      imageWidth,
      imageHeight,
      published = true,
      showOnHome = false,
      sortOrder = 0,
    } = req.body
    const parsedImage = parseImage(imageData)
    const art = await prisma.art.create({
      data: {
        title,
        description: description || null,
        ...parsedImage,
        imageWidth,
        imageHeight,
        published,
        showOnHome,
        sortOrder,
        publishedAt: published ? new Date() : null,
      },
      select: artSelect,
    })

    return res.status(201).json(toDto(art))
  }

  static async update(req: Request, res: Response) {
    const current = await prisma.art.findUnique({
      where: { id: req.params.id },
      select: { published: true },
    })
    if (!current) throw AppError.notFound('Arte', 'art_not_found')

    const {
      imageData,
      title,
      description,
      imageWidth,
      imageHeight,
      published,
      showOnHome,
      sortOrder,
    } = req.body
    const imageUpdate = imageData ? parseImage(imageData) : {}
    const art = await prisma.art.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(imageWidth !== undefined ? { imageWidth } : {}),
        ...(imageHeight !== undefined ? { imageHeight } : {}),
        ...(published !== undefined ? { published } : {}),
        ...(showOnHome !== undefined ? { showOnHome } : {}),
        ...(sortOrder !== undefined ? { sortOrder } : {}),
        ...(published === true && !current.published ? { publishedAt: new Date() } : {}),
        ...imageUpdate,
      },
      select: artSelect,
    })

    return res.json(toDto(art))
  }

  static async remove(req: Request, res: Response) {
    const result = await prisma.art.deleteMany({ where: { id: req.params.id } })
    if (!result.count) throw AppError.notFound('Arte', 'art_not_found')
    return res.status(204).send()
  }
}
