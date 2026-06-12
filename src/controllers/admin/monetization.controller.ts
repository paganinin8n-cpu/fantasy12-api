import { Request, Response } from 'express';
import { AdminWalletService } from '../../services/admin/admin-wallet.service';
import { AdminLedgerService } from '../../services/admin/admin-ledger.service';
import { AdminSubscriptionService } from '../../services/admin/admin-subscription.service';
import { AdminWalletCreditService } from '../../services/admin/admin-wallet-credit.service';
import { AdminBenefitsService } from '../../services/admin/admin-benefits.service';
import { AdminPaidBenefitsService } from '../../services/admin/admin-benefits-paid.service';
import { GetBenefitBalanceService } from '../../services/benefits/get-benefit-balance.service';

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

  static async debit(req: Request, res: Response) {
    const adminUserId = (req as any).user.id;
    const { userId } = req.params;
    const { amount, reason } = req.body;

    try {
      const result = await AdminWalletCreditService.debit(
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

  static async benefits(req: Request, res: Response) {
    const { userId } = req.params;
    const roundId = typeof req.query.roundId === 'string'
      ? req.query.roundId
      : undefined;

    const balance = await GetBenefitBalanceService.execute(userId, roundId);
    return res.json(balance);
  }

  static async creditFreeBenefit(req: Request, res: Response) {
    const adminUserId = (req as any).user.id;
    const { userId } = req.params;
    const { roundId, type, amount } = req.body;

    try {
      const result = await AdminBenefitsService.creditFree(
        adminUserId,
        userId,
        String(roundId),
        type,
        Number(amount)
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  static async creditPaidBenefit(req: Request, res: Response) {
    const adminUserId = (req as any).user.id;
    const { userId } = req.params;
    const { type, amount } = req.body;

    try {
      const result = await AdminPaidBenefitsService.creditPaid(
        adminUserId,
        userId,
        Number(amount),
        type
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }

  static async debitPaidBenefit(req: Request, res: Response) {
    const adminUserId = (req as any).user.id;
    const { userId } = req.params;
    const { type, amount } = req.body;

    try {
      const result = await AdminPaidBenefitsService.debitPaid(
        adminUserId,
        userId,
        Number(amount),
        type
      );
      return res.json(result);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
}
