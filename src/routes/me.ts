import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'

export class MeController {
  static async handle(req: AuthRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' })
    }

    return res.status(200).json({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    })
  }
}
