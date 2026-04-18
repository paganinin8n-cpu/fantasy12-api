import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

//
// POST /tickets
// Criação / atualização de bilhete com monetização integrada
//
router.post('/tickets', authMiddleware, TicketController.create);

export default router;
