import { Request, Response } from 'express';
import { RevalidateActiveSubscriptionsService } from '../../services/subscription/revalidate-active-subscriptions.service';

export class SubscriptionJobsController {
  static async revalidate(_req: Request, res: Response) {
    await RevalidateActiveSubscriptionsService.execute();
    return res.status(200).json({ status: 'ok' });
  }
}
