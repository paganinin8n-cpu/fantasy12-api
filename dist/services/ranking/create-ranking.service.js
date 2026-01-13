"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRankingService = void 0;
const prisma_1 = require("../../lib/prisma");
const client_1 = require("@prisma/client");
class CreateRankingService {
    async execute(input) {
        // 1️⃣ Validações básicas
        if (input.type === client_1.RankingType.BOLAO) {
            if (!input.endDate) {
                throw new Error('Ranking BOLAO exige data final');
            }
            if (input.participantIds.length === 0) {
                throw new Error('Ranking BOLAO exige participantes');
            }
        }
        // 2️⃣ Validação de usuários PRO
        if (input.type === client_1.RankingType.BOLAO || input.type === client_1.RankingType.PRO) {
            const users = await prisma_1.prisma.user.findMany({
                where: {
                    id: { in: input.participantIds },
                    role: client_1.UserRole.PRO
                }
            });
            if (users.length !== input.participantIds.length) {
                throw new Error('Apenas usuários PRO podem participar deste ranking');
            }
        }
        // 3️⃣ Criação do ranking
        const ranking = await prisma_1.prisma.ranking.create({
            data: {
                name: input.name,
                description: input.description,
                type: input.type,
                startDate: input.startDate,
                endDate: input.endDate
            }
        });
        // 4️⃣ Criação dos participantes com scoreInitial
        for (const userId of input.participantIds) {
            const lastScore = await prisma_1.prisma.userScoreHistory.findFirst({
                where: {
                    userId,
                    createdAt: {
                        lt: input.startDate
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const scoreInitial = lastScore?.scoreTotal ?? 0;
            await prisma_1.prisma.rankingParticipant.create({
                data: {
                    rankingId: ranking.id,
                    userId,
                    scoreInitial,
                    score: 0
                }
            });
        }
        return ranking;
    }
}
exports.CreateRankingService = CreateRankingService;
