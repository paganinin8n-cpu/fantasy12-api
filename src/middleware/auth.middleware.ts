import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

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
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const sessionUser = req.session?.user;
  if (!sessionUser) {
    return res.status(401).json({
      error: 'Usuário não autenticado',
    });
  }
  req.user = sessionUser as { id: string; role: UserRole; email?: string };
  return next();
}