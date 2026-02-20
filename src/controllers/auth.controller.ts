import { Request, Response } from 'express';
import { LoginService } from '../services/auth/login.service';

export class AuthController {
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      const result = await LoginService.execute({ email, password });

      // 🔐 Salvar na sessão
      req.session.user = {
        id: result.user.id,
        role: result.user.role,
        email: result.user.email,
      };

      return res.status(200).json({
        success: true,
        user: result.user,
      });
    } catch (error) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    return new Promise<Response>((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          resolve(res.status(500).json({ error: 'Erro ao fazer logout' }));
          return;
        }

        res.clearCookie('f12.session');
        resolve(res.status(200).json({ success: true }));
      });
    });
  }
}
