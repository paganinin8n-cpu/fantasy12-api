import { Request, Response } from 'express';
import { JoinBolaoService } from '../../services/bolao/join-bolao.service';

export class JoinBolaoController {
  static async handle(req: Request, res: Response) {
    const { rankingId } = req.params;
    const userId = (req as any).user?.id; // padrão já usado no projeto

    if (!rankingId) {
      return res.status(400).json({
        error: 'rankingId is required',
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'User not authenticated',
      });
    }

    try {
      const result = await JoinBolaoService.execute({
        rankingId,
        userId,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to join bolão',
      });
    }
  }
}
