import { Request, Response } from 'express';
import { JoinBolaoService } from '../../services/bolao/join-bolao.service';
import { AppError } from '../../errors/AppError';

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
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          details: error.details,
        });
      }

      return res.status(400).json({
        error: error.message ?? 'Não foi possível entrar na Mesa',
      });
    }
  }
}
