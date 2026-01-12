"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 🔐 Leitura explícita do secret
const rawSecret = process.env.JWT_SECRET;
// Validação em runtime
if (!rawSecret) {
    throw new Error('JWT_SECRET não configurado no ambiente');
}
// ✅ Normalização de tipo (TypeScript)
const JWT_SECRET = rawSecret;
// Expiração tipada corretamente
const JWT_EXPIRES_IN = '7d';
/**
 * Gera token JWT
 */
function generateToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN
    });
}
/**
 * Verifica token JWT
 */
function verifyToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
    };
}
//# sourceMappingURL=jwt.js.map