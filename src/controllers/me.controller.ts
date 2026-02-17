import { Response } from "express";
import { AuthRequest } from '../middleware/auth.middleware';  
import { UserProfileService } from "../services/user-profile.service";

export class MeController {
  static async handle(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = req.user.id;
    const service = new UserProfileService();
    const profile = await service.execute(userId);
    return res.json(profile);
  }
}