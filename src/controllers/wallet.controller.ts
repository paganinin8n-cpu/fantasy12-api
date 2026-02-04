import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

class WalletController {
  static async get(req: Request, res: Response) {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: {
        balance: true,
        updatedAt: true,
      },
    })

    if (!wallet) {
      return res.status(200).json({
        balance: 0,
        updatedAt: new Date().toISOString(),
      })
    }

    return res.status(200).json({
      balance: wallet.balance,
      updatedAt: wallet.updatedAt.toISOString(),
    })
  }
}

export default WalletController
