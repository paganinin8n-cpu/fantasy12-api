import { prisma } from '../../lib/prisma'
import { RankingTiebreakService } from './ranking-tiebreak.service'

type SnapshotRow = {
  userId: string
  scoreTotal: number
  scoreRound: number
  totalDoubles: number
  totalSuperDoubles: number
  userCreatedAt: Date
}

export class SnapshotRankingService {

  static async execute(roundId: string): Promise<void> {

    await prisma.$transaction(async (tx) => {

      /**
       * 1️⃣ validar rodada
       */
      const round = await tx.round.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          status: true,
          number: true,
          updatedAt: true,
        }
      })

      if (!round) {
        throw new Error('Round not found')
      }

      if (round.status !== 'SCORED') {
        throw new Error('Snapshot can only be generated for SCORED rounds')
      }

      const periodRef = [
        round.updatedAt.getUTCFullYear(),
        String(round.updatedAt.getUTCMonth() + 1).padStart(2, '0'),
      ].join('-')

      /**
       * 2️⃣ idempotência
       */
      const snapshotExists = await tx.rankingSnapshot.findFirst({
        where: { roundId },
        select: { id: true }
      })

      if (snapshotExists) {
        return
      }

      /**
       * 3️⃣ buscar rodadas válidas
       */
      const validRounds = await tx.round.findMany({
        where: {
          number: { lte: round.number },
          status: 'SCORED'
        },
        select: { id: true }
      })

      const validRoundIds = validRounds.map(r => r.id)

      if (validRoundIds.length === 0) {
        return
      }

      /**
       * 4️⃣ score acumulado
       */
      const history = await tx.userScoreHistory.findMany({
        where: {
          roundId: { in: validRoundIds }
        },
        select: {
          userId: true,
          scoreTotal: true,
          scoreRound: true,
          totalDoubles: true,
          totalSuperDoubles: true,
          user: {
            select: { createdAt: true },
          },
        },
        orderBy: [
          { round: { number: 'desc' } },
          { createdAt: 'desc' },
        ],
      })

      if (history.length === 0) {
        return
      }

      /**
       * 5️⃣ score da rodada atual
       */
      const roundScores = await tx.userScoreHistory.findMany({
        where: { roundId },
        select: {
          userId: true,
          scoreRound: true
        }
      })

      const roundScoreMap = new Map<string, number>()

      roundScores.forEach(r => {
        roundScoreMap.set(r.userId, r.scoreRound)
      })

      /**
       * 6️⃣ normalizar dados
       */
      const latestByUser = new Map<string, SnapshotRow>()
      for (const item of history) {
        if (latestByUser.has(item.userId)) continue
        latestByUser.set(item.userId, {
          userId: item.userId,
          scoreTotal: item.scoreTotal,
          scoreRound: roundScoreMap.get(item.userId) ?? 0,
          totalDoubles: item.totalDoubles,
          totalSuperDoubles: item.totalSuperDoubles,
          userCreatedAt: item.user.createdAt,
        })
      }
      const rows = Array.from(latestByUser.values())

      /**
       * 7️⃣ ordenação oficial
       */
      const rankedRows = RankingTiebreakService.rank(rows, row => ({
        userId: row.userId,
        scoreRanking: row.scoreTotal,
        superDoubleHits: row.totalSuperDoubles,
        doubleHits: row.totalDoubles,
        userCreatedAt: row.userCreatedAt,
      }))

      const snapshots = rankedRows.map(row => ({
          roundId,
          userId: row.userId,
          scoreTotal: row.scoreTotal,
          scoreRound: row.scoreRound,
          totalDoubles: row.totalDoubles,
          totalSuperDoubles: row.totalSuperDoubles,
          position: row.position,
          snapshotType: 'GLOBAL',
          periodRef
      }))

      /**
       * 9️⃣ persistência
       */
      await tx.rankingSnapshot.createMany({
        data: snapshots
      })

    })

  }

}
