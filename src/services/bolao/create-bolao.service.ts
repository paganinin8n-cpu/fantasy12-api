import { prisma } from '../../lib/prisma'
import { randomUUID } from 'crypto'
import { AppError } from '../../errors/AppError'
import {
  BolaoPrizeService,
  PrizeDistributionItem,
} from './bolao-prize.service'
import { normalizeMesaPrizeRules } from './mesa-prize-rules'
import { BolaoRegistrationWindowService } from './bolao-registration-window.service'

type CreateBolaoInput = {
  name: string
  description: string
  startDate: Date
  entryEndDate: Date
  endDate: Date
  entryFee?: number
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
      entryEndDate,
      endDate,
      entryFee = 0,
      prizeDistribution,
      createdByUserId,
    } = input
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

    if (!(entryEndDate instanceof Date) || Number.isNaN(entryEndDate.getTime())) {
      throw new Error('Informe uma data válida para o término dos acessos')
    }

    if (entryEndDate <= startDate) {
      throw new Error('A data de término dos acessos deve ser posterior à data de início')
    }

    if (entryEndDate > endDate) {
      throw new Error('A data de término dos acessos deve ser anterior ou igual à data de fim da Mesa')
    }

    if (!Number.isInteger(entryFee) || entryFee <= 0) {
      throw new Error('O acesso em tampinhas deve ser maior que zero')
    }

    const validatedPrizeDistribution =
      BolaoPrizeService.validateDistribution(prizeDistribution)

    try {
      BolaoRegistrationWindowService.assertNotClosed({
        startDate,
        entryEndDate,
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

    const result = await prisma.$transaction(async tx => {
      const bolao = await tx.ranking.create({
        data: {
          id: randomUUID(),
          name,
          description,
          type: 'BOLAO',
          status: 'ACTIVE',
          entryFee,
          maxParticipants: null,
          currentParticipants: 0,
          durationDays,
          prizeDistribution: validatedPrizeDistribution,
          ...BolaoPrizeService.calculatePool(0),
          startDate,
          entryEndDate,
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
            entryFee,
            maxParticipants: null,
            durationDays,
            startDate: startDate.toISOString(),
            entryEndDate: entryEndDate.toISOString(),
            endDate: endDate.toISOString(),
            prizeDistribution: validatedPrizeDistribution,
            createdByAdmin: true,
            autoJoinedCreator: false,
          },
        },
      })

      return bolao
    })

    return {
      id: result.id,
      name: result.name,
      status: result.status,
      entryFee: result.entryFee,
      maxParticipants: result.maxParticipants,
      currentParticipants: result.currentParticipants,
      startDate: result.startDate,
      entryEndDate: result.entryEndDate,
      endDate: result.endDate,
      prizeDistribution: result.prizeDistribution,
      grossCollected: result.grossCollected,
      platformFee: result.platformFee,
      prizePool: result.prizePool,
      settledAt: result.settledAt,
    }
  }
}
