"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = requirePermission;
const permissions_1 = require("../domain/permissions");
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        // Cast explícito para UserRole do Prisma
        const userRole = req.user.role;
        const allowed = permissions_1.RolePermissions[userRole] || [];
        if (!allowed.includes(permission)) {
            return res.status(403).json({ error: 'Permissão negada' });
        }
        next();
    };
}
//# sourceMappingURL=requirePermission.js.map