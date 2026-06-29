import { Request, Response } from 'express';
import { GetBolaoRankingService } from '../../services/bolao/get-bolao-ranking.service';
import { CloseBolaoService } from '../../services/bolao/close-bolao.service';

export class BolaoRankingController {
  static async close(req: Request, res: Response) {
    const { rankingId } = req.params;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    try {
      const result = await CloseBolaoService.execute({ rankingId, requestedByUserId });
      return res.json(result);
    } catch (error: any) {
      const status = error.statusCode ?? 400;
      return res.status(status).json({ error: error.message ?? 'Não foi possível encerrar a Mesa' });
    }
  }

  static async handle(req: Request, res: Response) {
    const { rankingId } = req.params;

    if (!rankingId) {
      return res.status(400).json({
        error: 'rankingId is required',
      });
    }

    try {
      const detail = await GetBolaoRankingService.execute({
        rankingId,
        viewerUserId: req.user?.id,
      });

      return res.json(detail);
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Não foi possível carregar o ranking da Mesa',
      });
    }
  }
}
