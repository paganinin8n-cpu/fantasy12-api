"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRankingService = void 0;
const ranking_repository_1 = require("../../repositories/ranking.repository");
class GetRankingService {
    constructor() {
        this.rankingRepo = new ranking_repository_1.RankingRepository();
    }
    async execute(rankingId) {
        return this.rankingRepo.listByRankingId(rankingId);
    }
}
exports.GetRankingService = GetRankingService;
