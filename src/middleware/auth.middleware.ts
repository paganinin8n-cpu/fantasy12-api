import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * Tipagem do request autenticado
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email?: string;
  };
}

/**
 * Middleware de autenticação via SESSION
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        role: true,
        email: true,
        adminBlockedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Usuário não autenticado',
      });
    }

    if (user.adminBlockedAt) {
      req.session.destroy(() => undefined);
      return res.status(403).json({
        error: 'account_admin_blocked',
        message: 'Conta bloqueada administrativamente. Entre em contato com o suporte.',
      });
    }

    req.session.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    req.user = req.session.user as { id: string; role: UserRole; email?: string };
    return next();
  } catch (error) {
    return next(error);
  }
}
