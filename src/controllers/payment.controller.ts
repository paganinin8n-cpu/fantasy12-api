import { Request, Response } from 'express'
import { CreatePaymentService } from '../services/payment/create-payment.service'

export class PaymentController {
  static async handle(req: Request, res: Response) {
    const sessionUser = req.session?.user

    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { packageId, method } = req.body

    if (!packageId || !method) {
      return res.status(400).json({ error: 'packageId and method are required' })
    }

    const payment = await CreatePaymentService.execute({
      userId: sessionUser.id,
      packageId,
      method,
    })

    return res.status(201).json(payment)
  }
}
