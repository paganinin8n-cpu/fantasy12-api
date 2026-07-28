import { prisma } from '../../lib/prisma'
import { randomUUID } from 'crypto'
import { BolaoRegistrationWindowService } from './bolao-registration-window.service'

type CreateInviteInput = {
  rankingId: string
  createdByUserId: string
  maxUses?: number
  expiresAt?: Date
}

export class CreateBolaoInviteService {
  static async execute({
    rankingId,
    createdByUserId,
    maxUses,
    expiresAt,
  }: CreateInviteInput) {
    if (
      maxUses !== undefined
      && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 10_000)
    ) {
      throw new Error('maxUses deve ser um inteiro entre 1 e 10000')
    }
    if (expiresAt && (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime()))) {
      throw new Error('expiresAt deve ser uma data válida')
    }
    if (expiresAt && expiresAt <= new Date()) {
      throw new Error('expiresAt deve estar no futuro')
    }

    const ranking = await prisma.ranking.findUnique({
      where: { id: rankingId },
      select: {
        id: true,
        type: true,
        status: true,
        createdByUserId: true,
        startDate: true,
        entryEndDate: true,
      },
    })

    if (!ranking) throw new Error('Mesa não encontrada')
    if (ranking.type !== 'BOLAO') throw new Error('Ranking não é uma Mesa')
    if (ranking.status !== 'ACTIVE') {
      throw new Error('Esta Mesa não está aberta para novos convites')
    }

    BolaoRegistrationWindowService.assertNotClosed(ranking)

    if (ranking.createdByUserId !== createdByUserId) {
      throw new Error('Apenas o dono da Mesa pode gerar convites')
    }

    const code = randomUUID()

    const invite = await prisma.bolaoInvite.create({
      data: {
        rankingId,
        code,
        maxUses,
        expiresAt,
        createdByUserId,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: createdByUserId,
        action: 'BOLAO_INVITE_CREATED',
        entity: 'BOLAO_INVITE',
        entityId: invite.id,
        metadata: {
          rankingId,
          maxUses: invite.maxUses,
          expiresAt: invite.expiresAt?.toISOString() ?? null,
        },
      },
    })

    return {
      id: invite.id,
      code: invite.code,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt,
      isActive: invite.isActive,
      createdAt: invite.createdAt,
    }
  }
}
