"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const create_ticket_service_1 = require("../services/ticket/create-ticket.service");
const router = (0, express_1.Router)();
/**
 * POST /api/tickets
 * Cria ou atualiza bilhete do usuário na rodada
 */
router.post('/tickets', async (req, res) => {
    const { userId, roundId, prediction } = req.body;
    const service = new create_ticket_service_1.CreateTicketService();
    const ticket = await service.execute({ userId, roundId, prediction });
    return res.json(ticket);
});
exports.default = router;
