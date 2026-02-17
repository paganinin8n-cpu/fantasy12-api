import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      role: string;
      email: string;
    };
  }
}
