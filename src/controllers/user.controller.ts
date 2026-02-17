import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private service = new UserService();

  async create(req: Request, res: Response) {
    try {
      const user = await this.service.createUser(req.body);
      return res.status(201).json(user);
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? "Erro ao criar usuário"
      });
    }
  }

  // ✅ LOGIN REAL (sessão)
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Email e senha obrigatórios"
        });
      }

      const user = await this.service.login(email, password);

      // 🔥 PONTO-CHAVE: cria a sessão
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error: any) {
      return res.status(401).json({
        error: error.message ?? "Credenciais inválidas"
      });
    }
  }
}
