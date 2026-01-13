"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculateRankingService = void 0;
const prisma_1 = require("../../lib/prisma");
class CalculateRankingService {
    async execute(input) {
        const { rankingStartDate, rankingEndDate } = input;
        // Busca todos os usuários que possuem histórico
        const users = await prisma_1.prisma.user.findMany({
            where: {
                scoreHistory: {
                    some: {}
                }
            },
            select: {
                id: true
            }
        });
        const results = [];
        for (const user of users) {
            // scoreInitial = último score ANTERIOR à data inicial
            const scoreInitialRecord = await prisma_1.prisma.userScoreHistory.findFirst({
                where: {
                    userId: user.id,
                    createdAt: {
                        lt: rankingStartDate
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const scoreInitial = scoreInitialRecord?.scoreTotal ?? 0;
            // scoreFinal = último score <= data final
            const scoreFinalRecord = await prisma_1.prisma.userScoreHistory.findFirst({
                where: {
                    userId: user.id,
                    createdAt: {
                        lte: rankingEndDate
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            // Se o usuário não pontuou dentro do período, ignora
            if (!scoreFinalRecord) {
                continue;
            }
            const scoreFinal = scoreFinalRecord.scoreTotal;
            const rankingScore = scoreFinal - scoreInitial;
            results.push({
                userId: user.id,
                scoreInitial,
                scoreFinal,
                rankingScore,
                lastScoreRound: scoreFinalRecord.scoreRound,
                lastScoreDate: scoreFinalRecord.createdAt
            });
        }
        return results;
    }
}
exports.CalculateRankingService = CalculateRankingService;
