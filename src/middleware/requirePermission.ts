import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Permission, RolePermissions } from '../domain/permissions';
import { UserRole } from '@prisma/client';

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Cast explícito para UserRole do Prisma
    const userRole = req.user.role as UserRole;
    const allowed = RolePermissions[userRole] || [];

    if (!allowed.includes(permission)) {
      return res.status(403).json({ error: 'Permissão negada' });
    }

    next();
  };
}