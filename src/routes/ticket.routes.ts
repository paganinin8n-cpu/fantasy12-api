import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate-request.middleware';
import { CreateTicketSchema } from '../validators/ticket.validator';
import { ticketRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

//
// POST /tickets
// Criação / atualização de bilhete com monetização integrada
//
router.post(
  '/tickets',
  ticketRateLimiter,
  authMiddleware,
  validateRequest(CreateTicketSchema),
  TicketController.create
);

//
// GET /tickets — histórico paginado dos tickets do usuário
//
router.get('/tickets', authMiddleware, TicketController.list);

export default router;
