import { Request, Response } from 'express';

import { ReviewBolaoRequestService } from '../../services/bolao/review-bolao-request.service';

export class ReviewBolaoRequestController {
  static async handle(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const { rankingId, participantId } = req.params;
    const { status } = req.body;

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const participant = await ReviewBolaoRequestService.execute({
      rankingId,
      participantId,
      reviewerUserId: userId,
      status,
    });

    return res.json(participant);
  }
}
