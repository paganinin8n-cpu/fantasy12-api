import { Request, Response, NextFunction } from 'express'
import { RequestPasswordResetService } from '../services/auth/request-password-reset.service'
import { ResetPasswordService } from '../services/auth/reset-password.service'
import {
  isEmailDeliveryConfigured,
  isEmailPreviewMode,
  sendPasswordResetEmail,
} from '../lib/email'

const PASSWORD_RESET_TTL_MIN = 30

export class PasswordResetController {
  /**
   * POST /api/auth/forgot-password
   * Sempre responde 200 para não vazar emails cadastrados.
   * Em dev, pode retornar previewResetUrl quando EMAIL_PROVIDER não está ativo.
   * Em produção, nunca retorna token/link e exige email real configurado no boot.
   */
  static async request(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      const baseUrl =
        process.env.FRONTEND_ORIGIN?.split(',')[0]?.trim() ??
        'http://localhost:5173'

      let rawToken: string | null = null
      const canDeliverEmail =
        process.env.NODE_ENV !== 'production' || isEmailDeliveryConfigured()

      if (!canDeliverEmail) {
        ;(req as any).log?.warn(
          { email },
          'Recuperacao de senha solicitada sem provedor de email configurado'
        )

        return res.status(200).json({
          ok: true,
          message:
            'Se este email estiver cadastrado, você receberá instruções em alguns minutos.',
          previewMode: false,
          previewResetUrl: null,
        })
      }

      try {
        const result = await RequestPasswordResetService.execute({ email })
        rawToken = result.rawToken
      } catch (tokenErr) {
        ;(req as any).log?.warn(
          { err: tokenErr, email },
          'Falha ao persistir token de reset; pedido sera respondido sem link'
        )
      }

      if (rawToken) {
        // Monta a URL apontando para a tela /reset-password do frontend.
        const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`

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

      const previewResetUrl =
        isEmailPreviewMode() && rawToken
          ? `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`
          : null

      return res.status(200).json({
        ok: true,
        message:
          'Se este email estiver cadastrado, você receberá instruções em alguns minutos.',
        previewMode: isEmailPreviewMode(),
        previewResetUrl,
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
