import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import userRoutes from './routes/user.routes';
import meRoutes from './routes/me';
import ticketRoutes from './routes/ticket.routes';
import rankingRoutes from './routes/ranking.routes';
import adminMonetizationRoutes from './routes/admin-monetization.routes';

// ✅ ROUTER INTERNO UNIFICADO
import internalRoutes from './routes/internal';

import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/**
 * 🔴 LOG GLOBAL — PRIMEIRO DE TUDO
 */
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/**
 * 🟢 ROTAS PÚBLICAS / API
 */
app.use('/api', ticketRoutes);
app.use('/api', userRoutes);
app.use('/api', rankingRoutes);
app.use('/api', meRoutes);

/**
 * 🔐 AUTENTICAÇÃO
 */
app.use('/auth', authRoutes);

/**
 * ⚙️ ROTAS INTERNAS (JOBS + WEBHOOKS)
 * ⚠️ ESTE É O PONTO QUE ESTAVA QUEBRADO
 */
app.use('/internal', internalRoutes);

/**
 * 🛠️ ADMIN — MONETIZAÇÃO / OPERAÇÕES
 */
app.use('/api', adminMonetizationRoutes);

app.get('/health', (_req, res) => {
  res.json({ api: 'ok', db: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Fantasy12 API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy12 API rodando na porta ${PORT}`);
});

// ⚠️ SEMPRE ÚLTIMO
app.use(errorHandler);
