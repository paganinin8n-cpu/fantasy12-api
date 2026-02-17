import { Request, Response } from 'express';
import { GetWalletService } from '../services/wallet/get-wallet.service';

class WalletController {
  static async get(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const wallet = await GetWalletService.execute(userId);

      return res.status(200).json(wallet);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  }
}

export default WalletController;
