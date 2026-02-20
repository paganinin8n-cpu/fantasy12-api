import { Request, Response } from 'express'
import { ListPaymentHistoryService } from '../services/payment/list-payment-history.service'

export class PaymentsHistoryController {
  static async handle(req: Request, res: Response) {
    try {
      const sessionUser = req.session?.user

      if (!sessionUser) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const history = await ListPaymentHistoryService.execute(sessionUser.id)

      return res.status(200).json(history)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch payment history' })
    }
  }
}
