import { NextFunction, Request, Response } from 'express'
import type { CookieOptions } from 'express-session'
import { z } from 'zod'

const configSchema = z.object({
  SESSION_IDLE_TTL_MIN: z.coerce.number().int().positive().max(1440).default(30),
  SESSION_ABSOLUTE_TTL_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .max(720)
    .default(24),
})

export type AuthenticatedSessionUser = {
  id: string
  role: string
  email: string
  sessionVersion: number
}

export function loadSessionSecurityConfig(
  env: NodeJS.ProcessEnv = process.env
) {
  const parsed = configSchema.parse({
    SESSION_IDLE_TTL_MIN: env.SESSION_IDLE_TTL_MIN ?? '30',
    SESSION_ABSOLUTE_TTL_HOURS:
      env.SESSION_ABSOLUTE_TTL_HOURS ?? '24',
  })

  return {
    idleTtlMs: parsed.SESSION_IDLE_TTL_MIN * 60 * 1000,
    absoluteTtlMs: parsed.SESSION_ABSOLUTE_TTL_HOURS * 60 * 60 * 1000,
  }
}

export function sessionCookieOptions(
  env: NodeJS.ProcessEnv = process.env
): CookieOptions {
  const secure =
    env.COOKIE_SECURE != null
      ? env.COOKIE_SECURE === 'true'
      : env.NODE_ENV === 'production'
  const sameSite =
    env.COOKIE_SAME_SITE === 'strict' ||
    env.COOKIE_SAME_SITE === 'lax' ||
    env.COOKIE_SAME_SITE === 'none'
      ? env.COOKIE_SAME_SITE
      : secure
        ? 'none'
        : 'lax'

  return {
    httpOnly: true,
    maxAge: loadSessionSecurityConfig(env).idleTtlMs,
    path: '/',
    sameSite,
    secure,
  }
}

export function clearSessionCookie(
  res: Response,
  env: NodeJS.ProcessEnv = process.env
): void {
  const options = sessionCookieOptions(env)
  res.clearCookie('f12.session', {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure === true,
  })
}

export async function establishAuthenticatedSession(
  req: Request,
  user: AuthenticatedSessionUser,
  absoluteTtlMs: number,
  now: () => number = Date.now
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate(error => (error ? reject(error) : resolve()))
  })

  req.session.user = user
  req.session.absoluteExpiresAt = now() + absoluteTtlMs

  await new Promise<void>((resolve, reject) => {
    req.session.save(error => (error ? reject(error) : resolve()))
  })
}

export function createSessionLifetimeMiddleware({
  now = Date.now,
  env = process.env,
}: {
  now?: () => number
  env?: NodeJS.ProcessEnv
} = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) return next()

    const expiresAt = req.session.absoluteExpiresAt
    if (typeof expiresAt === 'number' && expiresAt > now()) return next()

    req.session.destroy(() => undefined)
    clearSessionCookie(res, env)
    res.status(401).json({
      error: 'session_expired',
      message: 'Sessão expirada. Entre novamente.',
    })
  }
}
