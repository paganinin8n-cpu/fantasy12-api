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
}
