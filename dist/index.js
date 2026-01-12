"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const me_1 = __importDefault(require("./routes/me"));
const ticket_routes_1 = __importDefault(require("./routes/ticket.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', ticket_routes_1.default);
// 🔴 LOG GLOBAL — PROVA DEFINITIVA
app.use((req, _res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});
app.get('/health', (_req, res) => {
    res.json({ api: 'ok', db: 'ok' });
});
app.use('/auth', auth_1.default);
app.use('/api', user_routes_1.default);
app.use(me_1.default); // /me
app.get('/', (_req, res) => {
    res.json({
        name: 'Fantasy12 API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fantasy12 API rodando na porta ${PORT}`);
});
//# sourceMappingURL=index.js.map