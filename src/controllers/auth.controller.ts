import { Request, Response } from 'express'

export class AuthController {
  static async login(req: Request, res: Response): Promise<Response> {
    // login já existente
    return res.status(200).json({ success: true })
  }

  static async logout(req: Request, res: Response): Promise<Response> {
    return new Promise<Response>((resolve) => {
      req.session.destroy(err => {
        if (err) {
          resolve(res.status(500).json({ error: 'Erro ao fazer logout' }))
          return
        }

        res.clearCookie('connect.sid')
        resolve(res.status(200).json({ success: true }))
      })
    })
  }
}
