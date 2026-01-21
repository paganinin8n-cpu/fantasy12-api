import { Request, Response } from 'express';
import { AdminWalletService } from '../../services/admin/admin-wallet.service';
import { AdminLedgerService } from '../../services/admin/admin-ledger.service';
import { AdminSubscriptionService } from '../../services/admin/admin-subscription.service';
import { AdminWalletCreditService } from '../../services/admin/admin-wallet-credit.service';
import { AdminRoleService } from '../../services/admin/admin-role.service';
import { AdminBenefitsService } from '../../services/admin/admin-benefits.service';
import { AdminPaidBenefitsService } from '../../services/admin/admin-benefits-paid.service';
import { AdminBolaoService } from '../../services/admin/admin-bolao.service';

export class AdminMonetizationController {
  static wallet(req: Request, res: Response) {
    return AdminWalletService.getWalletByUser(req.params.userId)
      .then(res.json.bind(res));
  }

  static ledger(req: Request, res: Response) {
    return AdminLedgerService.listByUser(req.params.userId)
      .then(res.json.bind(res));
  }

  static subscriptions(req: Request, res: Response) {
    return AdminSubscriptionService.getByUser(req.params.userId)
      .then(res.json.bind(res));
  }

  static setRole(req: Request, res: Response) {
    const adminId = (req as any).user.id;
    const { role } = req.body;

    return AdminRoleService.setRole(adminId, req.params.userId, role)
      .then(res.json.bind(res));
  }

  static creditCoins(req: Request, res: Response) {
    const adminId = (req as any).user.id;
    const { amount, reason } = req.body;

    return AdminWalletCreditService.credit(
      adminId,
      req.params.userId,
      amount,
      reason
    ).then(res.json.bind(res));
  }

  static creditFree(req: Request, res: Response) {
    const adminId = (req as any).user.id;
    const { roundId, type, amount } = req.body;

    return AdminBenefitsService.creditFree(
      adminId,
      req.params.userId,
      roundId,
      type,
      amount
    ).then(res.json.bind(res));
  }

  static creditPaid(req: Request, res: Response) {
    const adminId = (req as any).user.id;
    const { type, amount } = req.body;

    return AdminPaidBenefitsService.creditPaid(
      adminId,
      req.params.userId,
      amount,
      type
    ).then(res.json.bind(res));
  }

  static createBolao(req: Request, res: Response) {
    const adminId = (req as any).user.id;
    return AdminBolaoService.create(adminId, req.body)
      .then(res.json.bind(res));
  }
}
