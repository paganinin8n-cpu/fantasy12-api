"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
const controller = new user_controller_1.UserController();
router.post("/users", (req, res) => controller.create(req, res));
exports.default = router;
//# sourceMappingURL=user.routes.js.map