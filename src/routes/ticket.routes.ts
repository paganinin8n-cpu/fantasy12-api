import { Router } from 'express';
import { CreateTicketService } from '../services/ticket/create-ticket.service';

const router = Router();

/**
 * POST /api/tickets
 * Cria ou atualiza bilhete do usuário na rodada
 */
router.post('/tickets', async (req, res) => {
  const { userId, roundId, prediction } = req.body;

  const service = new CreateTicketService();
  const ticket = await service.execute({ userId, roundId, prediction });

  return res.json(ticket);
});

export default router;
