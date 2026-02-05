import { Request, Response } from 'express';
import { CreateTicketService } from '../services/ticket/create-ticket.service';

export class TicketController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    const { roundId, prediction, betType } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!roundId || !prediction) {
      return res.status(400).json({
        error: 'roundId and prediction are required',
      });
    }

    try {
      const ticket = await CreateTicketService.execute({
        userId,
        roundId,
        prediction,
        betType,
      });

      return res.status(201).json(ticket);
    } catch (error: any) {
      return res.status(400).json({
        error: error.message ?? 'Failed to create ticket',
      });
    }
  }
}
