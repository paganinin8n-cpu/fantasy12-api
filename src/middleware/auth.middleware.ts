import { Request, Response, NextFunction } from 'express';

/**
 * Tipagem do request autenticado
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
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

  req.user = sessionUser;

  return next();
}
