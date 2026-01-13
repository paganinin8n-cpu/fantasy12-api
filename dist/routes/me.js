"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const me_controller_1 = require("../controllers/me.controller");
const router = (0, express_1.Router)();
const meController = new me_controller_1.MeController();
router.get('/me', auth_1.authMiddleware, (req, res) => {
    return meController.handle(req, res);
});
exports.default = router;
