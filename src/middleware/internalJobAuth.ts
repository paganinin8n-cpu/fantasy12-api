import { Request, Response, NextFunction } from 'express';

export function internalJobAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers['x-internal-job-token'];

  if (!token || token !== process.env.INTERNAL_JOB_SECRET) {
    return res.status(401).json({ error: 'Unauthorized internal job' });
  }

  next();
}
