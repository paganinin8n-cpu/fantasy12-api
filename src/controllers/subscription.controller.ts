import { Request, Response } from 'express';
import { GetSubscriptionStatusService } from '../services/subscription/get-subscription-status.service';

class SubscriptionController {
  static async get(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await GetSubscriptionStatusService.execute(userId);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  }
}

export default SubscriptionController;
