import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

type Role = 'ADMIN' | 'PRO' | 'NORMAL';

export const requireRole = (allowedRoles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // 🔒 Type guard explícito
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuário inválido' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // ✅ Agora o TS SABE que req.user existe
      req.user.role = user.role;

      return next();
    } catch (error) {
      console.error('[RBAC ERROR]', error);
      return res.status(500).json({ error: 'Erro interno de autorização' });
    }
  };
};
