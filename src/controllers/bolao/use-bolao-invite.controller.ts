import { Request, Response } from 'express';
import { UseBolaoInviteService } from '../../services/bolao/use-bolao-invite.service';
import { AppError } from '../../errors/AppError';

export class UseBolaoInviteController {
  static async handle(req: Request, res: Response) {
    const { code } = req.params;
    const userId = (req as any).user?.id;

    if (!code) {
      return res.status(400).json({ error: 'invite code is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
      const result = await UseBolaoInviteService.execute({ code, userId });
      return res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }

      return res.status(400).json({ error: error.message });
    }
  }
}
