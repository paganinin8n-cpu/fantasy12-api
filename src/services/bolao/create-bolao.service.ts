import { prisma } from '../../lib/prisma'
import { randomUUID } from 'crypto'
import { AppError } from '../../errors/AppError'
import {
  BolaoPrizeService,
  PrizeDistributionItem,
} from './bolao-prize.service'
import { normalizeMesaPrizeRules } from './mesa-prize-rules'
import { BolaoRegistrationWindowService } from './bolao-registration-window.service'
import { withMesaFinancialNames } from './mesa-financial-names'
import { MesaCategory } from '@prisma/client'
import { MesaCategoryRules } from './mesa-category-rules'

type CreateBolaoInput = {
  name: string
  description: string
  startDate: Date
  endDate: Date
  category?: MesaCategory
  accessCost?: number
  /** @deprecated Compatibility input. Use accessCost. */
  entryFee?: number
  sponsorPrizePool?: number
  maxParticipants: number
  prizeDistribution: PrizeDistributionItem[]
  createdByUserId: string
}

/**
 * Cria Mesa privada sem vínculo com rodada.
 * O criador (admin) fica como dono/operador; participantes entram depois.
 */
export class CreateBolaoService {
  static async execute(input: CreateBolaoInput) {
    const {
      name,
      description: rawDescription,
      startDate,
      endDate,
      prizeDistribution,
      createdByUserId,
    } = input
    const terms = MesaCategoryRules.validate({
      category: input.category,
      accessCost: input.accessCost,
      entryFee: input.entryFee,
      sponsorPrizePool: input.sponsorPrizePool,
      maxParticipants: input.maxParticipants,
    })
    const accessCost = terms.accessCost
    const description = normalizeMesaPrizeRules(rawDescription)

    const user = await prisma.user.findUnique({
      where: { id: createdByUserId },
      select: { id: true },
    })

    if (!user) {
      throw AppError.notFound('Usuário', 'user_not_found')
    }

    if (!name || name.trim().length < 3) {
      throw new Error('O nome da Mesa deve ter pelo menos 3 caracteres')
    }

    if (endDate <= startDate) {
      throw new Error('A data de fim deve ser posterior à data de início')
    }

    const validatedPrizeDistribution =
      BolaoPrizeService.validateDistribution(prizeDistribution)

    try {
      BolaoRegistrationWindowService.assertNotClosed({
        startDate,
        endDate,
      })
    } catch (error) {
      throw AppError.badRequest(
        error instanceof Error
          ? error.message
          : 'As inscrições para esta competição foram encerradas.',
        'mesa_registration_closed'
      )
    }

    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const emptyPool = BolaoPrizeService.calculatePool(0)

    const result = await prisma.$transaction(async tx => {
      const bolao = await tx.ranking.create({
        data: {
          id: randomUUID(),
          name,
          description,
          type: 'BOLAO',
          status: 'ACTIVE',
          category: terms.category,
          entryFee: accessCost,
          accessCost,
          sponsorPrizePool: terms.sponsorPrizePool,
          maxParticipants: terms.maxParticipants,
          currentParticipants: 0,
          durationDays,
          prizeDistribution: validatedPrizeDistribution,
          ...emptyPool,
          prizePool: MesaCategoryRules.isSponsored(terms)
            ? terms.sponsorPrizePool
            : emptyPool.prizePool,
          rewardPool: MesaCategoryRules.isSponsored(terms)
            ? terms.sponsorPrizePool
            : emptyPool.prizePool,
          startDate,
          entryEndDate: null,
          endDate,
          createdByUserId,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: createdByUserId,
          action: 'BOLAO_CREATED',
          entity: 'RANKING',
          entityId: bolao.id,
          metadata: {
            name,
            description,
            accessCost,
            entryFee: accessCost,
            category: terms.category,
            sponsorPrizePool: terms.sponsorPrizePool,
            maxParticipants: terms.maxParticipants,
            durationDays,
            startDate: startDate.toISOString(),
            entryEndDate: null,
            endDate: endDate.toISOString(),
            prizeDistribution: validatedPrizeDistribution,
            createdByAdmin: true,
            autoJoinedCreator: false,
          },
        },
      })

      return bolao
    })

    return withMesaFinancialNames({
      id: result.id,
      name: result.name,
      status: result.status,
      category: result.category,
      entryFee: result.entryFee,
      accessCost: result.accessCost,
      sponsorPrizePool: result.sponsorPrizePool,
      maxParticipants: result.maxParticipants,
      currentParticipants: result.currentParticipants,
      startDate: result.startDate,
      entryEndDate: result.entryEndDate,
      endDate: result.endDate,
      prizeDistribution: result.prizeDistribution,
      grossCollected: result.grossCollected,
      platformFee: result.platformFee,
      prizePool: result.prizePool,
      rewardPool: result.rewardPool,
      settledAt: result.settledAt,
    })
  }
}
