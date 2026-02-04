import { Request, Response } from 'express'
import { ListPaymentHistoryService } from '../services/payment/list-payment-history.service'

/**
 * PaymentsHistoryController
 *
 * Responsável exclusivamente por:
 * - Expor o histórico de pagamentos do usuário autenticado
 *
 * Regras:
 * - Usuário DEVE estar autenticado
 * - Nenhuma lógica de negócio aqui
 * - Apenas orquestra request → service → response
 */
export class PaymentsHistoryController {
  static async history(req: Request, res: Response) {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const history = await ListPaymentHistoryService.execute(userId)

    return res.status(200).json(history)
  }
}
