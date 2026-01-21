import { Request, Response } from 'express';
import { AdminWalletService } from '../../services/admin/admin-wallet.service';
import { AdminLedgerService } from '../../services/admin/admin-ledger.service';
import { AdminSubscriptionService } from '../../services/admin/admin-subscription.service';
import { AdminWalletCreditService } from '../../services/admin/admin-wallet-credit.service';

export class AdminMonetizationController {
  static async wallet(req: Request, res: Response) {
    const { userId } = req.params;
    const wallet = await AdminWalletService.getWalletByUser(userId);
    return res.json(wallet);
  }

  static async ledger(req: Request, res: Response) {
    const { userId } = req.params;
    const ledger = await AdminLedgerService.listByUser(userId);
    return res.json(ledger);
  }

  static async subscriptions(req: Request, res: Response) {
    const { userId } = req.params;
    const subs = await AdminSubscriptionService.getByUser(userId);
    return res.json(subs);
  }

  static async credit(req: Request, res: Response) {
    const adminUserId = (req as any).user.id;
    const { userId } = req.params;
    const { amount, reason } = req.body;

    try {
      const result = await AdminWalletCreditService.credit(
        adminUserId,
        userId,
        Number(amount),
        reason
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
}
