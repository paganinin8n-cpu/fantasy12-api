import { logger } from './logger'
import nodemailer from 'nodemailer'

/**
 * Abstração de envio de email.
 *
 * Em desenvolvimento: implementação console que apenas loga.
 * Em produção: exige provedor real configurado. Sem isso, a API falha no boot
 * para evitar recuperação de senha aberta ou links de preview expostos.
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

class SmtpEmailService implements EmailService {
  private readonly transporter
  private readonly from: string

  constructor() {
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT ?? 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.EMAIL_FROM

    if (!host || !user || !pass || !from) {
      throw new Error(
        'SMTP_HOST, SMTP_USER, SMTP_PASS e EMAIL_FROM sao obrigatorios para EMAIL_PROVIDER=smtp'
      )
    }

    this.from = from
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    })
  }

  async send({ to, subject, html, text }: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
      text,
    })

    logger.info({ to, subject }, 'Email enviado via SMTP')
  }
}

class DisabledEmailService implements EmailService {
  async send(): Promise<void> {
    throw new Error('email_delivery_not_configured')
  }
}

export function isEmailPreviewMode() {
  return process.env.NODE_ENV !== 'production' &&
    emailService instanceof ConsoleEmailService
}

export function isEmailDeliveryConfigured() {
  return !(emailService instanceof DisabledEmailService)
}

function createEmailService(): EmailService {
  const provider = (process.env.EMAIL_PROVIDER ?? '').toLowerCase()

  if (provider === 'smtp') {
    return new SmtpEmailService()
  }

  if (!provider && process.env.NODE_ENV === 'production') {
    logger.warn(
      'EMAIL_PROVIDER nao configurado; recuperacao de senha por email desabilitada em producao'
    )
    return new DisabledEmailService()
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`EMAIL_PROVIDER nao suportado em producao: ${provider}`)
  }

  return new ConsoleEmailService()
}

export const emailService: EmailService = createEmailService()

// ----------------------------------------------------------------
// Templates conhecidos
// ----------------------------------------------------------------

export async function sendPasswordResetEmail(opts: {
  to: string
  resetUrl: string
  expiresInMinutes: number
}) {
  const { to, resetUrl, expiresInMinutes } = opts

  const subject = 'Fantasy12 — redefinição de senha'

  const text = [
    'Fantasy12',
    '',
    'Redefinição de senha',
    '',
    'Recebemos uma solicitação para redefinir a senha da sua conta.',
    `O link abaixo é válido por ${expiresInMinutes} minutos:`,
    '',
    resetUrl,
    '',
    'Se você não fez essa solicitação, ignore este email — sua senha continua a mesma.',
    '',
    '— Time Fantasy12',
    'fantasy12.app@gmail.com',
  ].join('\n')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:32px 40px;text-align:center;">
            <span style="font-size:28px;font-weight:900;color:#f97316;letter-spacing:-0.5px;">Fantasy</span><span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">12</span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:2px;">Segurança da conta</p>
            <h1 style="margin:0 0 24px;font-size:24px;font-weight:900;color:#0f172a;line-height:1.2;">Redefinição de senha</h1>
            <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta no Fantasy12.
            </p>
            <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
              Clique no botão abaixo para criar uma nova senha. Este link expira em <strong style="color:#0f172a;">${expiresInMinutes} minutos</strong>.
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
              <tr>
                <td style="background:#f97316;border-radius:10px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                    Redefinir minha senha
                  </a>
                </td>
              </tr>
            </table>

            <!-- Fallback link -->
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">Se o botão não funcionar, copie e cole este link no navegador:</p>
            <p style="margin:0;font-size:11px;color:#64748b;word-break:break-all;">${resetUrl}</p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f8fafc;border-radius:0 0 16px 16px;">
            <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;line-height:1.6;">
              Se você não solicitou a redefinição de senha, ignore este email — sua senha continua a mesma e nenhuma alteração foi feita.
            </p>
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              © Fantasy12 · <a href="mailto:fantasy12.app@gmail.com" style="color:#94a3b8;text-decoration:none;">fantasy12.app@gmail.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await emailService.send({ to, subject, html, text })
}
