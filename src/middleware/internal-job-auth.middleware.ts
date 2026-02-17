import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * internalJobAuth
 *
 * Protege endpoints internos (cron, jobs, automações).
 * Usa comparação timing-safe para evitar ataques.
 */
export function internalJobAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const providedToken = req.headers['x-internal-job-token'];
  const expectedToken = process.env.INTERNAL_JOB_SECRET;

  if (!providedToken || !expectedToken) {
    return res.status(401).json({
      error: 'Unauthorized internal job',
    });
  }

  const providedBuffer = Buffer.from(String(providedToken));
  const expectedBuffer = Buffer.from(String(expectedToken));

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({
      error: 'Unauthorized internal job',
    });
  }

  return next();
}
