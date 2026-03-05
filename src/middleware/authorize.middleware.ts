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

      // 🔹 Buscar roles administrativas do usuário
      const roles = await prisma.userAdminRole.findMany({
        where: { userId },
        include: {
          role: true
        }
      })

      if (!roles.length) {
        return res.status(403).json({
          error: 'Permissão administrativa não encontrada'
        })
      }

      // 🔹 SUPERADMIN bypass
      const isSuperAdmin = roles.some(
        (r) => r.role.name === 'SUPERADMIN'
      )

      if (isSuperAdmin) {
        return next()
      }

      // 🔹 Buscar permissão específica
      const permission = await prisma.adminPermission.findUnique({
        where: { code: permissionCode },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      })

      if (!permission) {
        return res.status(500).json({
          error: `Permissão ${permissionCode} não encontrada`
        })
      }

      const allowedRoleIds = permission.roles.map(
        (r) => r.roleId
      )

      const hasPermission = roles.some(
        (r) => allowedRoleIds.includes(r.roleId)
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

        return res.status(403).json({
          error: 'Permissão insuficiente'
        })
      }

      // 🔹 Auditoria de sucesso
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
      return res.status(500).json({
        error: 'Erro interno de autorização'
      })
    }
  }
}