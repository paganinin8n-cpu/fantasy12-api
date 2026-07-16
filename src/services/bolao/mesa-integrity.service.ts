import { Prisma } from '@prisma/client'
import { BolaoPrizeService } from './bolao-prize.service'

export type MesaIntegrityIssue = {
  code: string
  message: string
  details?: Record<string, unknown>
}

type MesaParticipant = {
  status: string
  entryFeePaid: number
  entryPaidAt: Date | null
}

export type InspectableMesa = {
  id: string
  description: string | null
  entryFee: number
  prizeDistribution: Prisma.JsonValue | null
  grossCollected: number
  platformFee: number
  prizePool: number
  settledAt: Date | null
  participants: MesaParticipant[]
}

export class MesaIntegrityError extends Error {
  readonly issues: MesaIntegrityIssue[]

  constructor(issues: MesaIntegrityIssue[]) {
    super('Mesa bloqueada por inconsistências de integridade')
    this.name = 'MesaIntegrityError'
    this.issues = issues
  }
}

export class MesaIntegrityService {
  static inspect(mesa: InspectableMesa): MesaIntegrityIssue[] {
    const issues: MesaIntegrityIssue[] = []
    if (!mesa.description?.trim()) {
      issues.push({ code: 'MISSING_PRIZE_RULES', message: 'Observações/regras da Mesa ausentes' })
    }

    try {
      BolaoPrizeService.fromJson(mesa.prizeDistribution)
    } catch {
      issues.push({ code: 'INVALID_PRIZE_DISTRIBUTION', message: 'Distribuição de vencedores inválida' })
    }

    const approved = mesa.participants.filter(item => item.status === 'APPROVED')
    const unpaid = approved.filter(item =>
      !item.entryPaidAt || item.entryFeePaid !== mesa.entryFee
    )
    if (unpaid.length > 0) {
      issues.push({
        code: 'APPROVED_ENTRY_NOT_PAID',
        message: 'Há participantes aprovados sem comprovação integral da entrada',
        details: { count: unpaid.length },
      })
    }

    const expectedGross = approved
      .filter(item => item.entryPaidAt && item.entryFeePaid === mesa.entryFee)
      .reduce((total, item) => total + item.entryFeePaid, 0)
    if (mesa.grossCollected !== expectedGross) {
      issues.push({
        code: 'GROSS_COLLECTED_MISMATCH',
        message: 'Total arrecadado diverge das entradas comprovadamente pagas',
        details: { recorded: mesa.grossCollected, expected: expectedGross },
      })
    }

    const totals = BolaoPrizeService.calculatePool(mesa.grossCollected)
    if (mesa.platformFee !== totals.platformFee || mesa.prizePool !== totals.prizePool) {
      issues.push({
        code: 'PRIZE_TOTALS_MISMATCH',
        message: 'Taxa ou premiação líquida diverge do total arrecadado',
        details: { expectedPlatformFee: totals.platformFee, expectedPrizePool: totals.prizePool },
      })
    }
    return issues
  }

  static assertSettlementReady(mesa: InspectableMesa) {
    const issues = this.inspect(mesa)
    if (issues.length > 0) throw new MesaIntegrityError(issues)
  }

  static async diagnose(tx: Pick<Prisma.TransactionClient, 'ranking'>) {
    const mesas = await tx.ranking.findMany({
      where: { type: 'BOLAO' },
      select: {
        id: true, name: true, status: true, endDate: true,
        description: true, entryFee: true, prizeDistribution: true,
        grossCollected: true, platformFee: true, prizePool: true, settledAt: true,
        participants: {
          select: { status: true, entryFeePaid: true, entryPaidAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
    const records = mesas.map(mesa => ({
      id: mesa.id,
      name: mesa.name,
      status: mesa.status,
      endDate: mesa.endDate,
      expiredUnsettled: mesa.endDate != null && mesa.endDate < new Date() && !mesa.settledAt,
      issues: this.inspect(mesa),
    }))
    return {
      inspected: records.length,
      affected: records.filter(record => record.issues.length > 0).length,
      expiredUnsettled: records.filter(record => record.expiredUnsettled).length,
      records: records.filter(record => record.issues.length > 0 || record.expiredUnsettled),
    }
  }
}
