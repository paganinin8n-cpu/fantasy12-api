import { NextFunction, Request, Response } from 'express'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

type CsrfProtectionOptions = {
  allowedOrigins: string[]
}

function requestOrigin(req: Request): string | null {
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin.length > 0) return origin

  const referer = req.headers.referer
  if (typeof referer !== 'string' || referer.length === 0) return null

  try {
    return new URL(referer).origin
  } catch {
    return null
  }
}

function requestHasBody(req: Request) {
  const contentLength = Number(req.headers['content-length'] ?? 0)
  return contentLength > 0 || req.headers['transfer-encoding'] != null
}

/**
 * Protege mutacoes autenticadas por cookie contra CSRF.
 *
 * Rotas publicas continuam responsaveis por seus controles proprios. Webhooks
 * e jobs internos usam HMAC/segredo e nao participam do modelo de sessao.
 */
export function createCsrfProtection({
  allowedOrigins,
}: CsrfProtectionOptions) {
  const allowed = new Set(allowedOrigins)

  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next()
    if (req.path.startsWith('/internal')) return next()
    if (!req.session?.user) return next()

    const origin = requestOrigin(req)
    if (!origin || !allowed.has(origin)) {
      return res.status(403).json({
        error: 'csrf_origin_rejected',
        message: 'Origem da requisicao nao autorizada.',
      })
    }

    if (requestHasBody(req)) {
      const contentType = req.headers['content-type'] ?? ''
      if (!contentType.toLowerCase().startsWith('application/json')) {
        return res.status(415).json({
          error: 'json_content_type_required',
          message: 'Mutacoes autenticadas devem usar application/json.',
        })
      }
    }

    return next()
  }
}
