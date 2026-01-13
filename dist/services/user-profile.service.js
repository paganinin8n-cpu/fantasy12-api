"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileService = void 0;
const user_repository_1 = require("../repositories/user.repository");
class UserProfileService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    async execute(userId) {
        if (!userId) {
            throw new Error("ID do usuário não informado");
        }
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        return {
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
        };
    }
}
exports.UserProfileService = UserProfileService;
