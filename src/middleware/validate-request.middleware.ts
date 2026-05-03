import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

type Source = 'body' | 'query' | 'params'

/**
 * Cria um middleware Express que valida `req[source]` contra um schema Zod.
 * Em caso de erro, responde 400 com a lista de issues estruturada.
 *
 * Uso:
 *   router.post('/payments', validateRequest(CreatePaymentSchema), Controller.handle)
 */
export function validateRequest(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const error = result.error as ZodError
      return res.status(400).json({
        error: 'validation_error',
        message: 'Dados de entrada invalidos',
        issues: error.issues.map(issue => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      })
    }

    // Substitui pelo dado já parseado/normalizado
    ;(req as any)[source] = result.data
    next()
  }
}
