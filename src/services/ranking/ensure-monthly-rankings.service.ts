import { RankingType, RoundStatus, SubscriptionStatus } from '@prisma/client'
import { prisma } from '../../lib/prisma'

type EnsureMonthlyRankingsInput = {
  periodRef: string
  now?: Date
}

type SubscriptionAtCutoff = {
  status: SubscriptionStatus
  startAt: Date
  endAt: Date | null
} | null

export class EnsureMonthlyRankingsService {
  static async execute({
    periodRef,
    now = new Date(),
  }: EnsureMonthlyRankingsInput) {
    const { start, end } = this.parsePeriod(periodRef)
    const endDate = new Date(end.getTime() - 1)

    return prisma.$transaction(async tx => {
      const firstRound = await tx.round.findFirst({
        where: {
          closeAt: { gte: start, lt: end },
        },
        orderBy: [{ closeAt: 'asc' }, { number: 'asc' }],
        select: {
          id: true,
          number: true,
          status: true,
          closeAt: true,
        },
      })

      const definitions = [
        {
          id: `monthly-GLOBAL-${periodRef}`,
          name: `Ranking Geral Mensal ${periodRef}`,
          type: RankingType.GLOBAL,
        },
        {
          id: `monthly-PRO-${periodRef}`,
          name: `Ranking PRO Mensal ${periodRef}`,
          type: RankingType.PRO,
        },
      ] as const

      const existingRankings = await tx.ranking.findMany({
        where: {
          type: { in: [RankingType.GLOBAL, RankingType.PRO] },
          periodRef,
        },
        select: {
          id: true,
          type: true,
          _count: { select: { participants: true } },
        },
      })

      const rankings: Array<{ id: string; type: RankingType }> = []
      for (const definition of definitions) {
        const ranking = await tx.ranking.upsert({
          where: {
            type_periodRef: {
              type: definition.type,
              periodRef,
            },
          },
          update: {
            startDate: start,
            endDate,
          },
          create: {
            id: definition.id,
            name: definition.name,
            type: definition.type,
            status: 'ACTIVE',
            periodRef,
            startDate: start,
            endDate,
          },
        })
        rankings.push(ranking)
      }

      if (!firstRound?.closeAt) {
        return {
          periodRef,
          registrationOpen: false,
          firstRoundId: null,
          generalAdded: 0,
          proAdded: 0,
        }
      }

      for (const ranking of rankings) {
        await tx.rankingRound.upsert({
          where: {
            rankingId_roundId: {
              rankingId: ranking.id,
              roundId: firstRound.id,
            },
          },
          update: {},
          create: {
            rankingId: ranking.id,
            roundId: firstRound.id,
          },
        })
      }

      const closedStatuses: RoundStatus[] = [
        RoundStatus.CLOSED,
        RoundStatus.SCORED,
        RoundStatus.CANCELLED,
      ]
      const registrationOpen =
        !closedStatuses.includes(firstRound.status) && firstRound.closeAt > now

      const existingByType = new Map(
        existingRankings.map(ranking => [ranking.type, ranking])
      )
      const needsInitialBootstrap = definitions.some(definition =>
        !existingByType.has(definition.type) ||
        existingByType.get(definition.type)?._count.participants === 0
      )

      if (!registrationOpen && !needsInitialBootstrap) {
        return {
          periodRef,
          registrationOpen: false,
          firstRoundId: firstRound.id,
          generalAdded: 0,
          proAdded: 0,
        }
      }

      const eligibilityDate = registrationOpen ? now : firstRound.closeAt
      const users = await tx.user.findMany({
        where: {
          createdAt: { lt: eligibilityDate },
        },
        select: {
          id: true,
          scoreTotal: true,
          createdAt: true,
          subscription: {
            select: {
              status: true,
              startAt: true,
              endAt: true,
            },
          },
        },
      })

      let scoreAtCutoff = new Map<string, number>()
      if (!registrationOpen && users.length > 0) {
        const histories = await tx.userScoreHistory.findMany({
          where: {
            userId: { in: users.map(user => user.id) },
            round: { closeAt: { lt: firstRound.closeAt } },
          },
          orderBy: [
            { round: { closeAt: 'desc' } },
            { createdAt: 'desc' },
          ],
          select: { userId: true, scoreTotal: true },
        })
        scoreAtCutoff = new Map()
        for (const history of histories) {
          if (!scoreAtCutoff.has(history.userId)) {
            scoreAtCutoff.set(history.userId, history.scoreTotal)
          }
        }
      }

      const scoreInitialFor = (user: typeof users[number]) =>
        registrationOpen
          ? user.scoreTotal
          : scoreAtCutoff.get(user.id) ?? 0
      const generalUsers = users
      const proUsers = users.filter(user =>
        this.isProAt(user.subscription, eligibilityDate)
      )

      const generalResult = await tx.rankingParticipant.createMany({
        data: generalUsers.map(user => ({
          rankingId: rankings[0].id,
          userId: user.id,
          scoreInitial: scoreInitialFor(user),
          score: 0,
          status: 'APPROVED' as const,
          approvedAt: now,
        })),
        skipDuplicates: true,
      })
      const proResult = await tx.rankingParticipant.createMany({
        data: proUsers.map(user => ({
          rankingId: rankings[1].id,
          userId: user.id,
          scoreInitial: scoreInitialFor(user),
          score: 0,
          status: 'APPROVED' as const,
          approvedAt: now,
        })),
        skipDuplicates: true,
      })

      if (generalResult.count > 0 || proResult.count > 0) {
        await tx.auditLog.create({
          data: {
            action: 'MONTHLY_RANKINGS_SYNCHRONIZED',
            entity: 'RANKING',
            entityId: rankings[0].id,
            metadata: {
              periodRef,
              firstRoundId: firstRound.id,
              registrationOpen,
              generalAdded: generalResult.count,
              proAdded: proResult.count,
            },
          },
        })
      }

      return {
        periodRef,
        registrationOpen,
        firstRoundId: firstRound.id,
        generalAdded: generalResult.count,
        proAdded: proResult.count,
      }
    })
  }

  private static parsePeriod(periodRef: string) {
    const match = /^(\d{4})-(\d{2})$/.exec(periodRef)
    if (!match) throw new Error('Invalid period format. Expected YYYY-MM')

    const year = Number(match[1])
    const month = Number(match[2])
    if (month < 1 || month > 12) {
      throw new Error('Invalid month. Expected a value from 01 to 12')
    }

    return {
      start: new Date(Date.UTC(year, month - 1, 1)),
      end: new Date(Date.UTC(year, month, 1)),
    }
  }

  private static isProAt(
    subscription: SubscriptionAtCutoff,
    date: Date
  ) {
    if (!subscription) return false
    if (subscription.status === SubscriptionStatus.EXPIRED) return false
    if (subscription.startAt > date) return false
    return !subscription.endAt || subscription.endAt > date
  }
}
