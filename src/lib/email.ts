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
