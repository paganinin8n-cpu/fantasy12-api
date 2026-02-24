import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import session from 'express-session'

import adminRoundRoutes from './routes/admin-round.routes'

/**
 * 🔐 AUTH
 */
import authRoutes from './routes/auth'

/**
 * 🟢 PUBLIC
 */
import userRoutes from './routes/user.routes'
import meRoutes from './routes/me'
import ticketRoutes from './routes/ticket.routes'
import rankingRoutes from './routes/ranking.routes'

/**
 * 🛠️ ADMIN
 */
import adminMonetizationRoutes from './routes/admin-monetization.routes'
import adminSubscriptionsRoutes from './routes/admin-subscriptions.routes'

/**
 * ⚙️ INTERNAL
 */
import internalRoutes from './routes/internal'

/**
 * ⚠️ ERROR HANDLER
 */
import { errorHandler } from './middleware/error-handler'

dotenv.config()

const app = express()

/* ======================================================
   🔥 PROXY TRUST (OBRIGATÓRIO NO EASYPANEL)
====================================================== */
app.set('trust proxy', 1)

/* ======================================================
   🔥 BODY PARSER (OBRIGATÓRIO PARA LOGIN FUNCIONAR)
====================================================== */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ======================================================
   🌍 CORS PRODUÇÃO (EasyPanel + Front separado)
====================================================== */
app.use((req, res, next) => {
  const allowedOrigin =
    'https://f12-banco-frontend-f12.x18arx.easypanel.host'

  res.header('Access-Control-Allow-Origin', allowedOrigin)
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

/* ======================================================
   🔐 SESSION (COOKIE CROSS DOMAIN + PROXY SAFE)
====================================================== */
app.use(
  session({
    name: 'f12.session',
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    proxy: true, // 🔥 ESSENCIAL ATRÁS DE PROXY
    cookie: {
      httpOnly: true,
      secure: true,     // obrigatório em HTTPS
      sameSite: 'none', // obrigatório cross-domain
    },
  })
)

/* ======================================================
   🔴 LOG GLOBAL
====================================================== */
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[REQ] ${req.method} ${req.url}`)
  next()
})

/* ======================================================
   🟢 PUBLIC ROUTES
====================================================== */
app.use('/api', ticketRoutes)
app.use('/api', userRoutes)
app.use('/api', rankingRoutes)
app.use('/api', meRoutes)

/* ======================================================
   🔐 AUTH ROUTES
====================================================== */
app.use('/auth', authRoutes)

/* ======================================================
   ⚙️ INTERNAL ROUTES
====================================================== */
app.use('/internal', internalRoutes)

/* ======================================================
   🛠️ ADMIN ROUTES
====================================================== */
app.use('/api', adminMonetizationRoutes)
app.use('/api', adminSubscriptionsRoutes)
app.use('/api', adminRoundRoutes)

/* ======================================================
   ❤️ HEALTH
====================================================== */
app.get('/health', (_req, res) => {
  res.json({ api: 'ok', db: 'ok' })
})

/* ======================================================
   ROOT
====================================================== */
app.get('/', (_req, res) => {
  res.json({
    name: 'Fantasy12 API',
    status: 'running',
    timestamp: new Date().toISOString(),
  })
})

/* ======================================================
   ⚠️ ERROR HANDLER (SEMPRE POR ÚLTIMO)
====================================================== */
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3001)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy12 API rodando na porta ${PORT}`)
})