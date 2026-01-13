"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreRoundService = void 0;
const prisma_1 = require("../../lib/prisma");
const round_repository_1 = require("../../repositories/round.repository");
const ticket_repository_1 = require("../../repositories/ticket.repository");
const user_score_history_repository_1 = require("../../repositories/user-score-history.repository");
const client_1 = require("@prisma/client");
class ScoreRoundService {
    constructor() {
        this.roundRepo = new round_repository_1.RoundRepository();
        this.ticketRepo = new ticket_repository_1.TicketRepository();
        this.historyRepo = new user_score_history_repository_1.UserScoreHistoryRepository();
    }
    /**
     * Apura a rodada:
     * - bloqueia reapuração
     * - calcula score de cada ticket
     * - persiste scoreRound no ticket
     * - gera histórico cumulativo por usuário
     * - marca a rodada como SCORED
     */
    async execute(roundId) {
        const round = await this.roundRepo.findById(roundId);
        if (!round) {
            throw new Error('Rodada não encontrada');
        }
        if (round.status === client_1.RoundStatus.SCORED) {
            throw new Error('Rodada já apurada (SCORED)');
        }
        if (round.status !== client_1.RoundStatus.CLOSED) {
            throw new Error('Rodada não está fechada para apuração');
        }
        if (!round.result) {
            throw new Error('Resultado da rodada não informado');
        }
        const tickets = await this.ticketRepo.findByRound(roundId);
        const resultArray = round.result.split('-');
        await prisma_1.prisma.$transaction(async () => {
            for (const ticket of tickets) {
                const predictionArray = ticket.prediction.split('-');
                let scoreRound = 0;
                predictionArray.forEach((prediction, index) => {
                    if (prediction === resultArray[index]) {
                        scoreRound += 1;
                    }
                });
                // Atualiza score do ticket
                await this.ticketRepo.updateScore(ticket.id, scoreRound);
                // Define status do ticket
                const status = scoreRound > 0 ? client_1.TicketStatus.WON : client_1.TicketStatus.LOST;
                await this.ticketRepo.updateStatus(ticket.id, status);
                // Busca último score acumulado do usuário
                const lastHistory = await this.historyRepo.findLastByUser(ticket.userId);
                const lastTotal = lastHistory ? lastHistory.scoreTotal : 0;
                // Cria histórico cumulativo
                await this.historyRepo.create({
                    userId: ticket.userId,
                    roundId,
                    scoreRound,
                    scoreTotal: lastTotal + scoreRound
                });
            }
            // Marca rodada como apurada (estado final)
            await this.roundRepo.updateStatus(roundId, client_1.RoundStatus.SCORED);
        });
    }
}
exports.ScoreRoundService = ScoreRoundService;
