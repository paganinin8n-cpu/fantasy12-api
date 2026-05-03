import { logger } from './logger'

/**
 * Abstração de envio de email.
 *
 * Hoje: implementação console (dev) que apenas loga.
 *
 * Para integrar provedor real:
 *   1. Criar um adaptador concreto (e.g. ResendEmailService) que implementa
 *      a interface `EmailService`.
 *   2. Trocar o export `emailService` no fim deste arquivo para usar a
 *      variável de ambiente `EMAIL_PROVIDER` (resend / ses / sendgrid).
 *   3. Configurar credenciais no .env (ex: RESEND_API_KEY).
 */
export interface EmailService {
  send(input: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void>
}

class ConsoleEmailService implements EmailService {
  async send({ to, subject, html, text }: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    logger.info(
      { to, subject, length: text.length },
      '📧 [DEV] Email simulado enviado (configure EMAIL_PROVIDER em produção)'
    )

    if (process.env.NODE_ENV !== 'production') {
      logger.debug({ to, subject, html, text }, '📧 conteúdo do email')
    }
  }
}

/**
 * Singleton — em produção, plugar provedor real.
 *
 * Exemplo (Resend):
 *
 *   import { Resend } from 'resend'
 *   const resend = new Resend(process.env.RESEND_API_KEY)
 *   class ResendEmailService implements EmailService { ... }
 */
export const emailService: EmailService = new ConsoleEmailService()

// ----------------------------------------------------------------
// Templates conhecidos
// ----------------------------------------------------------------

export async function sendPasswordResetEmail(opts: {
  to: string
  resetUrl: string
  expiresInMinutes: number
}) {
  const { to, resetUrl, expiresInMinutes } = opts

  const subject = 'Fantasy12 — recuperação de senha'

  const text = [
    'Recebemos uma solicitação para redefinir a senha da sua conta no Fantasy12.',
    '',
    `Acesse o link abaixo para criar uma nova senha (válido por ${expiresInMinutes} minutos):`,
    resetUrl,
    '',
    'Se você não pediu isso, ignore este email — sua senha continua a mesma.',
    '',
    '— Time Fantasy12',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color:#0f172a; max-width:560px;">
      <h2 style="color:#f97316;">Recuperação de senha</h2>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Fantasy12.</p>
      <p>Acesse o link abaixo para criar uma nova senha (válido por ${expiresInMinutes} minutos):</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Redefinir senha
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">
        Se você não pediu isso, ignore este email — sua senha continua a mesma.
      </p>
    </div>
  `

  await emailService.send({ to, subject, html, text })
}
