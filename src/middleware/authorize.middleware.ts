import { Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from './auth.middleware'

type AuthorizeOptions = {
  audit?: boolean
  entity?: string
  getEntityId?: (req: AuthRequest) => string | undefined
}

export const authorize = (
  permissionCode: string,
  options?: AuthorizeOptions
) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' })
      }

      const userId = req.user.id

      const adminRole = await prisma.userAdminRole.findFirst({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      })

      if (!adminRole) {
        return res.status(403).json({ error: 'Permissão administrativa não encontrada' })
      }

      const hasPermission = adminRole.role.permissions.some(
        (p) => p.permission.code === permissionCode
      )

      if (!hasPermission) {
        if (options?.audit) {
          await prisma.adminAuditLog.create({
            data: {
              adminId: userId,
              action: 'PERMISSION_DENIED',
              entity: options.entity || 'SYSTEM',
              entityId: options.getEntityId?.(req),
              payload: {
                permissionCode,
                route: req.originalUrl,
                method: req.method
              },
              ipAddress: req.ip
            }
          })
        }

        return res.status(403).json({ error: 'Permissão insuficiente' })
      }

      if (options?.audit) {
        await prisma.adminAuditLog.create({
          data: {
            adminId: userId,
            action: 'PERMISSION_GRANTED',
            entity: options.entity || 'SYSTEM',
            entityId: options.getEntityId?.(req),
            payload: {
              permissionCode,
              route: req.originalUrl,
              method: req.method
            },
            ipAddress: req.ip
          }
        })
      }

      return next()
    } catch (error) {
      console.error('[AUTHORIZE ERROR]', error)
      return res.status(500).json({ error: 'Erro interno de autorização' })
    }
  }
}