"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class TicketRepository {
    async findByUserAndRound(userId, roundId) {
        return prisma_1.prisma.ticket.findUnique({
            where: {
                userId_roundId: {
                    userId,
                    roundId
                }
            }
        });
    }
    async findByRound(roundId) {
        return prisma_1.prisma.ticket.findMany({
            where: { roundId }
        });
    }
    async create(data) {
        return prisma_1.prisma.ticket.create({
            data: {
                userId: data.userId,
                roundId: data.roundId,
                prediction: data.prediction,
                status: client_1.TicketStatus.PENDING
            }
        });
    }
    async updatePrediction(ticketId, prediction) {
        return prisma_1.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                prediction,
                updatedAt: new Date()
            }
        });
    }
    async updateStatus(ticketId, status) {
        return prisma_1.prisma.ticket.update({
            where: { id: ticketId },
            data: { status }
        });
    }
    async updateScore(ticketId, scoreRound) {
        return prisma_1.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                scoreRound,
                updatedAt: new Date()
            }
        });
    }
}
exports.TicketRepository = TicketRepository;
