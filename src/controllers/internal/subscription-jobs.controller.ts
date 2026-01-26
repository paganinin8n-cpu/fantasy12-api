import { Request, Response } from 'express';
import { RevalidateActiveSubscriptionsService } from '../../services/subscription/revalidate-active-subscriptions.service';

export class SubscriptionJobsController {
  static async revalidate(_req: Request, res: Response) {
    const timestamp = new Date().toISOString();

    console.info({
      level: 'INFO',
      service: 'SubscriptionJobsController',
      action: 'job.revalidate.start',
      message: 'Início do job de revalidação de assinaturas',
      timestamp,
    });

    await RevalidateActiveSubscriptionsService.execute();

    console.info({
      level: 'INFO',
      service: 'SubscriptionJobsController',
      action: 'job.revalidate.finish',
      message: 'Job de revalidação concluído',
      timestamp,
    });

    return res.status(200).json({ status: 'ok' });
  }
}
