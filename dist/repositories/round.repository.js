"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoundRepository = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
class RoundRepository {
    async getLastRoundNumber() {
        const last = await prisma_1.prisma.round.findFirst({
            orderBy: { number: 'desc' },
            select: { number: true }
        });
        return last?.number ?? 0;
    }
    async findOpenRound() {
        return prisma_1.prisma.round.findFirst({
            where: { status: client_1.RoundStatus.OPEN }
        });
    }
    async create(data) {
        return prisma_1.prisma.round.create({
            data: {
                number: data.number,
                openAt: data.openAt,
                closeAt: data.closeAt,
                status: client_1.RoundStatus.OPEN
            }
        });
    }
    async updateStatus(roundId, status) {
        return prisma_1.prisma.round.update({
            where: { id: roundId },
            data: { status }
        });
    }
    async findById(roundId) {
        return prisma_1.prisma.round.findUnique({
            where: { id: roundId }
        });
    }
}
exports.RoundRepository = RoundRepository;
//# sourceMappingURL=round.repository.js.map