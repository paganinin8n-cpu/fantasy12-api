"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTicketService = void 0;
// src/services/ticket/create-ticket.service.ts
const ticket_repository_1 = require("../../repositories/ticket.repository");
const client_1 = require("@prisma/client");
class CreateTicketService {
    constructor() {
        this.ticketRepository = new ticket_repository_1.TicketRepository();
    }
    async execute({ userId, roundId, prediction }) {
        // 1️⃣ Validação básica
        if (!userId || !roundId || !prediction) {
            throw new Error('Dados obrigatórios não informados');
        }
        // 2️⃣ Verifica se já existe ticket para o usuário nesta rodada
        const existingTicket = await this.ticketRepository.findByUserAndRound(userId, roundId);
        // 3️⃣ Se já existir, atualiza a previsão
        if (existingTicket) {
            // Só permite edição se ainda estiver pendente
            if (existingTicket.status !== client_1.TicketStatus.PENDING) {
                throw new Error('Bilhete não pode mais ser alterado');
            }
            return this.ticketRepository.updatePrediction(existingTicket.id, prediction);
        }
        // 4️⃣ Caso não exista, cria novo ticket
        return this.ticketRepository.create({
            userId,
            roundId,
            prediction
        });
    }
}
exports.CreateTicketService = CreateTicketService;
//# sourceMappingURL=create-ticket.service.js.map