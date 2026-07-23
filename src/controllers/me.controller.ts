import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { UserProfileService } from '../services/user-profile.service'
import { UpdateProfileService } from '../services/user/update-profile.service'
import { ChangePasswordService } from '../services/user/change-password.service'
import { AppError } from '../errors/AppError'
import { clearSessionCookie } from '../lib/session-security'

export class MeController {
  static async handle(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized()
      const profile = await new UserProfileService().execute(req.user.id)
      return res.json(profile)
    } catch (err) {
      return next(err)
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw AppError.unauthorized()
      const updated = await UpdateProfileService.execute({
        userId: req.user.id,
        data: req.body,
      })
      return res.json(updated)
    } catch (err) {
      return next(err)
    }
  }

  static async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) throw AppError.unauthorized()
      await ChangePasswordService.execute({
        userId: req.user.id,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
      })
      clearSessionCookie(res)
      return res.status(200).json({ ok: true })
    } catch (err) {
      return next(err)
    }
  }
}
