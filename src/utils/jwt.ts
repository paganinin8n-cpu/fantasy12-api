import jwt, { JwtPayload as JwtLibPayload, SignOptions } from 'jsonwebtoken';

// 🔐 Leitura explícita do secret
const rawSecret = process.env.JWT_SECRET;

// Validação em runtime
if (!rawSecret) {
  throw new Error('JWT_SECRET não configurado no ambiente');
}

// ✅ Normalização de tipo (TypeScript)
const JWT_SECRET: string = rawSecret;

// Expiração tipada corretamente
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = '7d';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Gera token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verifica token JWT
 */
export function verifyToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtLibPayload;

  return {
    id: decoded.id as string,
    email: decoded.email as string,
    role: decoded.role as string
  };
}
