import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/user.routes';
import meRoutes from './routes/me';
import ticketRoutes from './routes/ticket.routes';


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', ticketRoutes);

// 🔴 LOG GLOBAL — PROVA DEFINITIVA
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ api: 'ok', db: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use(meRoutes); // /me

app.get('/', (_req: Request, res: Response) => {
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