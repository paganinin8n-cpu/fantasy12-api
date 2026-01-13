"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingController = void 0;
const get_ranking_service_1 = require("../services/ranking/get-ranking.service");
class RankingController {
    async show(req, res) {
        const { rankingId } = req.params;
        const service = new get_ranking_service_1.GetRankingService();
        const ranking = await service.execute(rankingId);
        return res.json(ranking);
    }
}
exports.RankingController = RankingController;
