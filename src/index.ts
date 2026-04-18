import express, { Request, Response, NextFunction } from 'express'
import dotenv from 'dotenv'
import session from 'express-session'
import helmet from 'helmet'

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
import roundRoutes from './routes/round.routes'

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

const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET nao configurado no ambiente')
}

const isProduction = process.env.NODE_ENV === 'production'
const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ??
  process.env.FRONTEND_ORIGIN ??
  ''
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const cookieSecure =
  process.env.COOKIE_SECURE != null
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction

const cookieSameSite = (
  process.env.COOKIE_SAME_SITE ??
  (cookieSecure ? 'none' : 'lax')
) as 'lax' | 'strict' | 'none'

const app = express()

/* ======================================================
   🔥 PROXY TRUST (OBRIGATÓRIO NO EASYPANEL)
====================================================== */
app.set('trust proxy', 1)

/* ======================================================
   🔥 BODY PARSER
====================================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ======================================================
   🌍 CORS
====================================================== */
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin)
  }

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
   🔐 SESSION
====================================================== */
app.use(
  session({
    name: 'f12.session',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: cookieSameSite,
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
app.use('/api', roundRoutes)

/* ======================================================
   🔐 AUTH ROUTES (CORRIGIDO)
====================================================== */
app.use('/api/auth', authRoutes)

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
   ⚠️ ERROR HANDLER
====================================================== */
app.use(errorHandler)

const PORT = Number(process.env.PORT ?? 3001)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fantasy12 API rodando na porta ${PORT}`)
})
