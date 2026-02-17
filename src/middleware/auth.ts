import { Request, Response, NextFunction } from 'express';

/**
 * AuthRequest
 * - Extende Request
 * - user vem da sessão
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

/**
 * authMiddleware
 *
 * Regras canônicas:
 * - Backend é soberano
 * - Autenticação via SESSION (cookie)
 * - JWT NÃO é usado neste projeto
 */
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // sessão criada no login
  const sessionUser = (req as any).session?.user;

  if (!sessionUser) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  // injeta user no request
  req.user = sessionUser;

  return next();
}
