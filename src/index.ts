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
 * 🌐 CORS DEFINITIVO PRODUÇÃO
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (curl, healthcheck)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'https://f12-banco-frontend-f12.x18arx.easypanel.host',
        'http://localhost:5173'
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 🔥 IMPORTANTÍSSIMO PARA PREFLIGHT
app.options('*', cors());

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
      secure: true,
      sameSite: 'none',
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
 * 🟢 ROTAS PÚBLICAS
 */
app.use('/api', ticketRoutes);
app.use('/api', userRoutes);
app.use('/api', rankingRoutes);
app.use('/api', meRoutes);

/**
 * 🔐 AUTH
 */
app.use('/auth', authRoutes);

/**
 * ⚙️ INTERNAS
 */
app.use('/internal', internalRoutes);

/**
 * 🛠️ ADMIN
 */
app.use('/api', adminMonetizationRoutes);
app.use('/api', adminSubscriptionsRoutes);
app.use('/api', adminRoundRoutes);

/**
 * ❤️ HEALTH
 */
app.get('/health', (_req, res) => {
  res.json({ api: 'ok', db: 'ok' });
});

/**
 * ROOT
 */
app.get('/', (_req, res) => {
  res.json({
    name: 'Fantasy12 API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy12 API rodando na porta ${PORT}`);
});