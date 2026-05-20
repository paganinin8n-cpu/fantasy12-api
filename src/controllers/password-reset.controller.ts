import { Request, Response, NextFunction } from 'express'
import { RequestPasswordResetService } from '../services/auth/request-password-reset.service'
import { ResetPasswordService } from '../services/auth/reset-password.service'
import { FindUserByEmailService } from '../services/auth/find-user-by-email.service'
import { PasswordResetTokenService } from '../services/auth/password-reset-token.service'
import { isEmailPreviewMode, sendPasswordResetEmail } from '../lib/email'
import crypto from 'crypto'

const PASSWORD_RESET_TTL_MIN = 30

export class PasswordResetController {
  /**
   * POST /api/auth/forgot-password
   * Sempre responde 200 para não vazar emails cadastrados.
   * Em dev, loga o token cru no console para facilitar testes.
   */
  static async request(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      const baseUrl =
        process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim() ??
        'http://localhost:5173'
      const knownUser = await FindUserByEmailService.execute(email)

      let rawToken: string | null = null

      try {
        const result = await RequestPasswordResetService.execute({ email })
        rawToken = result.rawToken
      } catch (tokenErr) {
        ;(req as any).log?.warn(
          { err: tokenErr, email },
          'Falha ao persistir token de reset; usando fallback stateless'
        )
      }

      if (!rawToken && knownUser) {
        rawToken = PasswordResetTokenService.sign({
          userId: knownUser.id,
          email: knownUser.email,
        })
      }

      if (rawToken) {
        // Monta a URL apontando para a tela /reset-password do frontend.
        const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`

        // Envio é best-effort — não bloqueia/expõe o pedido em caso de falha SMTP.
        try {
          await sendPasswordResetEmail({
            to: email,
            resetUrl,
            expiresInMinutes: PASSWORD_RESET_TTL_MIN,
          })
        } catch (emailErr) {
          ;(req as any).log?.error(
            { err: emailErr, email },
            'Falha ao enviar email de reset de senha'
          )
        }
      }

      const previewToken =
        rawToken ??
        PasswordResetTokenService.sign({
          userId: knownUser?.id ?? 'preview-user',
          email: knownUser?.email ?? email.toLowerCase(),
        })
      const previewResetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(previewToken)}`

      return res.status(200).json({
        ok: true,
        message:
          'Se este email estiver cadastrado, você receberá instruções em alguns minutos.',
        previewMode: isEmailPreviewMode(),
        previewResetUrl: isEmailPreviewMode() ? previewResetUrl : null,
      })
    } catch (err) {
      return next(err)
    }
  }

  /**
   * POST /api/auth/reset-password
   * Confirma o token e troca a senha.
   */
  static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body
      await ResetPasswordService.execute({ token, newPassword })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return next(err)
    }
  }
}
