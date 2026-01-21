import { Request, Response } from 'express';
import { UseBolaoInviteService } from '../../services/bolao/use-bolao-invite.service';

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
      return res.status(400).json({ error: error.message });
    }
  }
}
