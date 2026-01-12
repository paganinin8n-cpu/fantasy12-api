"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não informado' });
    }
    const [, token] = authHeader.split(' ');
    if (!token) {
        return res.status(401).json({ error: 'Token malformado' });
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}
//# sourceMappingURL=auth.js.map