import { Request, Response } from 'express';
import { RevalidateActiveSubscriptionsService } from '../../services/subscription/revalidate-active-subscriptions.service';
import { InternalJobRunnerService } from '../../services/internal/internal-job-runner.service';

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

    const result = await InternalJobRunnerService.execute({
      jobName: 'REVALIDATE_SUBSCRIPTIONS',
      referenceId: timestamp.slice(0, 13),
      run: async () => {
        await RevalidateActiveSubscriptionsService.execute();
        return { checkedAt: timestamp };
      },
    });

    console.info({
      level: 'INFO',
      service: 'SubscriptionJobsController',
      action: 'job.revalidate.finish',
      message: 'Job de revalidação concluído',
      timestamp,
    });

    return res.status(200).json({
      status: 'ok',
      execution: {
        id: result.executionId,
        status: result.status,
      },
    });
  }
}
