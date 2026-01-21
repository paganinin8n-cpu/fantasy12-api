import { Request, Response } from 'express';
import { CreateBolaoInviteService } from '../../services/bolao/create-bolao-invite.service';

export class CreateBolaoInviteController {
  static async handle(req: Request, res: Response) {
    const { rankingId } = req.params;
    const userId = (req as any).user?.id;
    const { maxUses, expiresAt } = req.body ?? {};

    if (!rankingId) {
      return res.status(400).json({ error: 'rankingId is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
      const invite = await CreateBolaoInviteService.execute({
        rankingId,
        createdByUserId: userId,
        maxUses,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      return res.status(201).json(invite);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
