import { prisma } from '../../lib/prisma'
import { Prisma } from '@prisma/client'

type GrantPaidBenefitInput = {
  userId: string
  roundId: string
  type: 'DOUBLE' | 'SUPER_DOUBLE'
  quantity?: number
}

/**
 * GrantPaidBenefitService
 *
 * Responsável exclusivamente por:
 * - Conceder benefícios pagos ao usuário
 *
 * Regras:
 * - NÃO debita wallet
 * - NÃO cria ticket
 * - NÃO consome benefício
 * - Apenas concede (grant)
 *
 * Uso futuro:
 * - Compra direta de benefícios
 * - Promoções
 * - Pacotes especiais
 */
export class GrantPaidBenefitService {
  static async execute({
    userId,
    roundId,
    type,
    quantity = 1,
  }: GrantPaidBenefitInput) {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const benefit = await tx.roundBenefit.upsert({
        where: {
          userId_roundId: { userId, roundId },
        },
        update: {},
        create: {
          userId,
          roundId,
          freeDoubles: 0,
          freeSuperDoubles: 0,
        },
      })

      if (type === 'DOUBLE') {
        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeDoubles: { increment: quantity },
          },
        })
      }

      if (type === 'SUPER_DOUBLE') {
        await tx.roundBenefit.update({
          where: { id: benefit.id },
          data: {
            freeSuperDoubles: { increment: quantity },
          },
        })
      }

      return {
        granted: type,
        quantity,
        roundId,
        userId,
      }
    })
  }
}
