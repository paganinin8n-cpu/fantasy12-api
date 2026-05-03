import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/AppError'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

/**
 * Formato padrão de erro do Fantasy12 API:
 *
 *   {
 *     "error": "snake_case_code",     // chave estável p/ o frontend
 *     "message": "string legível",    // pode ser exibida ao usuário
 *     "details": {...}                // opcional, dados estruturados
 *   }
 *
 * Validação Zod sempre inclui `issues: [{ path, code, message }]`.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1) AppError do domínio
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    })
  }

  // 2) ZodError caso vaze de algum service
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Dados de entrada invalidos',
      issues: err.issues.map(i => ({
        path: i.path.join('.'),
        code: i.code,
        message: i.message,
      })),
    })
  }

  // 3) Erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'unique_violation',
        message: 'Já existe um registro com esse valor',
        details: { target: err.meta?.target },
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'not_found',
        message: 'Recurso não encontrado',
      })
    }
  }

  // 4) Fallback: erro inesperado
  ;(req as any).log?.error(
    { err, method: req.method, url: req.originalUrl },
    'unhandled error'
  )

  return res.status(500).json({
    error: 'internal_error',
    message: 'Erro interno do servidor',
  })
}
