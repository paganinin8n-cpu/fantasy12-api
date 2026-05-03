import { prisma } from '../../lib/prisma'
import { MercadoPagoClient } from '../../lib/mercado-pago.client'
import { AppError } from '../../errors/AppError'
import { PaymentProvider, SubscriptionStatus } from '@prisma/client'

interface Input {
  userId: string
}

/**
 * Cancela a assinatura ativa do usuário.
 *
 * - Se houver `externalSubscriptionId` no provedor, manda o cancelamento
 *   também no Mercado Pago (não cobra mais o cartão).
 * - Marca a assinatura local como CANCELLED imediatamente.
 *   O acesso PRO permanece até `endAt` — quem decide isso é a regra
 *   de leitura (subscription status).
 */
export class CancelSubscriptionService {
  static async execute({ userId }: Input) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      throw AppError.notFound('Assinatura', 'subscription_not_found')
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw AppError.conflict(
        'Assinatura já cancelada',
        'subscription_already_cancelled'
      )
    }

    // Cancela no provedor — best effort.
    if (
      subscription.provider === PaymentProvider.MERCADO_PAGO &&
      subscription.externalSubscriptionId &&
      process.env.MP_ACCESS_TOKEN
    ) {
      try {
        const mp = new MercadoPagoClient(process.env.MP_ACCESS_TOKEN)
        await mp.cancelSubscription(subscription.externalSubscriptionId)
      } catch (err) {
        // Loga mas não bloqueia o cancelamento local — o usuário não pode
        // ficar refém de um erro do MP.
        console.error({
          level: 'ERROR',
          service: 'CancelSubscriptionService',
          message: 'Falha ao cancelar no Mercado Pago',
          subscriptionId: subscription.id,
          externalSubscriptionId: subscription.externalSubscriptionId,
          error: (err as Error).message,
        })
      }
    }

    return prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELLED },
    })
  }
}
