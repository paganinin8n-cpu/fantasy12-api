"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
class UserController {
    constructor() {
        this.service = new user_service_1.UserService();
    }
    async create(req, res) {
        try {
            const user = await this.service.createUser(req.body);
            return res.status(201).json(user);
        }
        catch (error) {
            return res.status(400).json({
                error: error.message ?? "Erro ao criar usuário"
            });
        }
    }
}
exports.UserController = UserController;
