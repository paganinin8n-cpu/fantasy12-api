"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_repository_1 = require("../repositories/user.repository");
const createUser_validator_1 = require("../validators/createUser.validator");
class UserService {
    constructor() {
        this.repository = new user_repository_1.UserRepository();
    }
    async createUser(payload) {
        const data = createUser_validator_1.CreateUserSchema.parse(payload);
        const emailExists = await this.repository.findByEmail(data.email);
        if (emailExists) {
            throw new Error("Email já cadastrado");
        }
        const cpfExists = await this.repository.findByCpf(data.cpf);
        if (cpfExists) {
            throw new Error("CPF já cadastrado");
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await this.repository.create({
            ...data,
            password: hashedPassword,
            role: "NORMAL"
        });
        return {
            id: user.id,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map