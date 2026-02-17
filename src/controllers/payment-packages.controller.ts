import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

/**
 * PaymentPackagesController
 *
 * Responsável exclusivamente por:
 * - Expor pacotes de pagamento ativos
 *
 * Regras:
 * - Read-only
 * - Nenhuma lógica financeira
 */
class PaymentPackagesController {
  static async list(req: Request, res: Response) {
    const packages = await prisma.paymentPackage.findMany({
      where: { isActive: true },
      orderBy: { amountCents: 'asc' },
      select: {
        id: true,
        label: true,
        coinsAmount: true,
        bonusCoins: true,
        amountCents: true,
      },
    })

    return res.status(200).json(packages)
  }
}

export default PaymentPackagesController
