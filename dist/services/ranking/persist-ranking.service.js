"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistRankingService = void 0;
const prisma_1 = require("../../lib/prisma");
const calculate_ranking_service_1 = require("./calculate-ranking.service");
class PersistRankingService {
    constructor() {
        this.calculateService = new calculate_ranking_service_1.CalculateRankingService();
    }
    async execute(input) {
        const { rankingId, rankingStartDate, rankingEndDate } = input;
        const results = await this.calculateService.execute({
            rankingStartDate,
            rankingEndDate
        });
        // Ordenação determinística (critério já definido)
        const ordered = results.sort((a, b) => {
            if (b.rankingScore !== a.rankingScore) {
                return b.rankingScore - a.rankingScore;
            }
            if (b.lastScoreRound !== a.lastScoreRound) {
                return b.lastScoreRound - a.lastScoreRound;
            }
            return a.lastScoreDate.getTime() - b.lastScoreDate.getTime();
        });
        let position = 1;
        for (const item of ordered) {
            await prisma_1.prisma.rankingParticipant.upsert({
                where: {
                    rankingId_userId: {
                        rankingId,
                        userId: item.userId
                    }
                },
                update: {
                    score: item.rankingScore,
                    scoreInitial: item.scoreInitial,
                    position
                },
                create: {
                    rankingId,
                    userId: item.userId,
                    score: item.rankingScore,
                    scoreInitial: item.scoreInitial,
                    position
                }
            });
            position++;
        }
    }
}
exports.PersistRankingService = PersistRankingService;
