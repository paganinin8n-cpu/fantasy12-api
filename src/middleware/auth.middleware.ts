import { Request, Response, NextFunction } from 'express';

/**
 * Interface do usuário autenticado via sessão
 */
export interface SessionUser {
  id: string;
  role: string;
  email: string;
}

/**
 * Request tipado com usuário autenticado
 */
export interface AuthRequest extends Request {
  user?: SessionUser;
  session?: {
    user?: SessionUser;
  };
}

/**
 * authMiddleware
 *
 * Autenticação baseada em SESSION (cookie).
 * Backend é soberano.
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
