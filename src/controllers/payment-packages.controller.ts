import { Request, Response } from 'express';
import { ListPaymentPackagesService } from '../services/payment/list-payment-packages.service';

class PaymentPackagesController {
  static async list(req: Request, res: Response) {
    try {
      const packages = await ListPaymentPackagesService.execute();
      return res.status(200).json(packages);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch payment packages' });
    }
  }
}

export default PaymentPackagesController;
