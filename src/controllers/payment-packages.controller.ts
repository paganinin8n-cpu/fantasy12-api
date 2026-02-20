import { Request, Response } from 'express'
import { ListPaymentPackagesService } from '../services/payment/list-payment-packages.service'

export class PaymentPackagesController {
  static async handle(req: Request, res: Response) {
    try {
      const packages = await ListPaymentPackagesService.execute()
      return res.status(200).json(packages)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch payment packages' })
    }
  }
}
