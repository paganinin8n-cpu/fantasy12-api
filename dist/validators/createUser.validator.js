"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    nickname: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    cpf: zod_1.z.string().min(11),
    phone: zod_1.z.string().min(8),
    password: zod_1.z.string().min(6)
});
//# sourceMappingURL=createUser.validator.js.map