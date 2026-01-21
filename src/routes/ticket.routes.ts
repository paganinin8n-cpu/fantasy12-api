import { Router } from 'express';
import { TicketController } from '../controllers/ticket.controller';

const router = Router();

//
// POST /tickets
// Criação / atualização de bilhete com monetização integrada
//
router.post('/tickets', TicketController.create);

export default router;
