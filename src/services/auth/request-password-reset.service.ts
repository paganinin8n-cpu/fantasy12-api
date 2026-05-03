import crypto from 'crypto'
import { prisma } from '../../lib/prisma'

const TOKEN_BYTES = 32
const TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutos

/**
 * Inicia o fluxo de recuperação de senha.
 *
 * Características de segurança:
 * - Resposta sempre genérica: não revela se o email existe ou não.
 * - Token cru é retornado APENAS para o caller (que envia por email);
 *   no banco fica apenas o SHA-256.
 * - Tokens anteriores não usados são invalidados ao gerar um novo.
 *
 * O envio de email fica a cargo do caller — em produção, plugar
 * um provedor (Resend / SES / SendGrid). Em dev, logar e usar
 * o link manualmente está OK.
 */
export class RequestPasswordResetService {
  static async execute({
    email,
  }: {
    email: string
  }): Promise<{ rawToken: string | null }> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Sempre retorna sucesso aparente para não vazar emails cadastrados.
      return { rawToken: null }
    }

    // Invalida tokens anteriores não usados.
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex')
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    })

    return { rawToken }
  }
}
