import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';

import adminRoundRoutes from './routes/admin-round.routes';

/**
 * 🔐 AUTENTICAÇÃO
 */
import authRoutes from './routes/auth';

/**
 * 🟢 ROTAS PÚBLICAS
 */
import userRoutes from './routes/user.routes';
import meRoutes from './routes/me';
import ticketRoutes from './routes/ticket.routes';
import rankingRoutes from './routes/ranking.routes';

/**
 * 🛠️ ADMIN
 */
import adminMonetizationRoutes from './routes/admin-monetization.routes';
import adminSubscriptionsRoutes from './routes/admin-subscriptions.routes';

/**
 * ⚙️ ROTAS INTERNAS
 */
import internalRoutes from './routes/internal';

/**
 * ⚠️ ERROR HANDLER
 */
import { errorHandler } from './middleware/error-handler';

dotenv.config();

const app = express();

/**
 * 🌐 MIDDLEWARES BÁSICOS
 */
app.use(
  cors({
    origin: [
      'https://f12-banco-frontend-f12.x18arx.easypanel.host',
      'http://localhost:5173',
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'f12.session',
    secret: process.env.JWT_SECRET || 'f12-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,        // 🔥 obrigatório em HTTPS
      sameSite: 'none',    // 🔥 obrigatório cross-domain
    },
  })
);

/**
 * 🔴 LOG GLOBAL
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
 * ⚙️ ROTAS INTERNAS
 */
app.use('/internal', internalRoutes);

/**
 * 🛠️ ADMIN
 */
app.use('/api', adminMonetizationRoutes);
app.use('/api', adminSubscriptionsRoutes);
app.use('/api', adminRoundRoutes); // 🔥 NOVA ROTA ADMIN DE RODADA

/**
 * ❤️ HEALTHCHECK
 */
app.get('/health', (_req, res) => {
  res.json({ api: 'ok', db: 'ok' });
});

/**
 * 📍 ROOT
 */
app.get('/', (_req, res) => {
  res.json({
    name: 'Fantasy12 API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * ⚠️ ERROR HANDLER (melhor antes do listen)
 */
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy12 API rodando na porta ${PORT}`);
});
