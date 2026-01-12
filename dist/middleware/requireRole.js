"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const prisma_1 = require("../lib/prisma");
const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // 🔒 Type guard explícito
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }
            const userId = req.user.id;
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (!user) {
                return res.status(401).json({ error: 'Usuário inválido' });
            }
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            // ✅ Agora o TS SABE que req.user existe
            req.user.role = user.role;
            return next();
        }
        catch (error) {
            console.error('[RBAC ERROR]', error);
            return res.status(500).json({ error: 'Erro interno de autorização' });
        }
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=requireRole.js.map