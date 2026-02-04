import { Request, Response } from 'express'
import { CreatePaymentService } from '../services/payment/create-payment.service'

class PaymentController {
  static async create(req: Request, res: Response) {
    const userId = (req as any).user?.id
    const { packageId, method } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    if (!packageId || !method) {
      return res.status(400).json({ error: 'packageId and method are required' })
    }

    const payment = await CreatePaymentService.execute({
      userId,
      packageId,
      method,
    })

    return res.status(201).json(payment)
  }
}

export default PaymentController
