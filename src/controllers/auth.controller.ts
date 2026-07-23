import { NextFunction, Request, Response } from 'express';
import { LoginService } from '../services/auth/login.service';
import {
  clearSessionCookie,
  establishAuthenticatedSession,
  loadSessionSecurityConfig,
} from '../lib/session-security'

export class AuthController {
  static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      const result = await LoginService.execute({ email, password });

      await establishAuthenticatedSession(
        req,
        result.user,
        loadSessionSecurityConfig().absoluteTtlMs
      )

      return res.status(200).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    return new Promise<Response>((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          resolve(res.status(500).json({ error: 'Erro ao fazer logout' }));
          return;
        }

        clearSessionCookie(res)
        resolve(res.status(200).json({ success: true }));
      });
    });
  }
}
