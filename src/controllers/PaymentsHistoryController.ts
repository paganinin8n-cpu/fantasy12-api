import { Request, Response } from 'express';
import { ListPaymentHistoryService } from '../services/payment/list-payment-history.service';

class PaymentsHistoryController {
  static async history(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const history = await ListPaymentHistoryService.execute(userId);

      return res.status(200).json(history);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  }
}

export default PaymentsHistoryController;
