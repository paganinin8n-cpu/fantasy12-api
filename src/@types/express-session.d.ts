import 'express-session';

declare module 'express-session' {
  interface SessionData {
    absoluteExpiresAt?: number;
    user?: {
      id: string;
      role: string;
      email: string;
      sessionVersion: number;
    };
  }
}
