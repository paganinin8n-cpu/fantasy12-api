"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get("/health", async (_req, res) => {
    await prisma_1.prisma.$queryRaw `SELECT 1`;
    return res.json({ api: "ok", db: "ok" });
});
exports.default = router;
//# sourceMappingURL=health.js.map