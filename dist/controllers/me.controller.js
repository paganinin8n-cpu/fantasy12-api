"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeController = void 0;
const user_profile_service_1 = require("../services/user-profile.service");
class MeController {
    async handle(req, res) {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        // ✅ Correto: variável local, valor vem de req.user.id
        const userId = req.user.id;
        const service = new user_profile_service_1.UserProfileService();
        const profile = await service.execute(userId);
        return res.json(profile);
    }
}
exports.MeController = MeController;
