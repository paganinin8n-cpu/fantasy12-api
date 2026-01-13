"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ranking_controller_1 = require("../controllers/ranking.controller");
const router = (0, express_1.Router)();
const controller = new ranking_controller_1.RankingController();
/**
 * GET /rankings/:rankingId
 * Público — somente leitura
 */
router.get('/rankings/:rankingId', controller.show);
exports.default = router;
