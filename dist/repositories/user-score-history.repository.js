"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserScoreHistoryRepository = void 0;
const prisma_1 = require("../lib/prisma");
class UserScoreHistoryRepository {
    async findLastByUser(userId) {
        return prisma_1.prisma.userScoreHistory.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async create(data) {
        return prisma_1.prisma.userScoreHistory.create({ data });
    }
}
exports.UserScoreHistoryRepository = UserScoreHistoryRepository;
