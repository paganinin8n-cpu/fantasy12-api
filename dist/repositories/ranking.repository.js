"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingRepository = void 0;
const prisma_1 = require("../lib/prisma");
class RankingRepository {
    async listByRankingId(rankingId) {
        return prisma_1.prisma.rankingParticipant.findMany({
            where: { rankingId },
            orderBy: { position: 'asc' },
            select: {
                position: true,
                score: true,
                scoreInitial: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        profileImage: true
                    }
                }
            }
        });
    }
}
exports.RankingRepository = RankingRepository;
