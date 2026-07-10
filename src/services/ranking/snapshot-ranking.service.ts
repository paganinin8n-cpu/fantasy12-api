import { prisma } from '../../lib/prisma'

type SnapshotRow = {
  userId: string
  scoreTotal: number
  scoreRound: number
  totalDoubles: number
  totalSuperDoubles: number
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
        })
      }
      const rows = Array.from(latestByUser.values())

      /**
       * 7️⃣ ordenação oficial
       */
      rows.sort((a, b) => {
        if (b.scoreTotal !== a.scoreTotal) return b.scoreTotal - a.scoreTotal
        if (b.scoreRound !== a.scoreRound) return b.scoreRound - a.scoreRound
        if (b.totalDoubles !== a.totalDoubles) return b.totalDoubles - a.totalDoubles
        if (b.totalSuperDoubles !== a.totalSuperDoubles) return b.totalSuperDoubles - a.totalSuperDoubles
        return a.userId.localeCompare(b.userId)
      })

      /**
       * 8️⃣ calcular posições com empate
       */
      let currentPosition = 1
      let lastScoreTotal: number | null = null
      let lastScoreRound: number | null = null
      let lastTotalDoubles: number | null = null
      let lastTotalSuperDoubles: number | null = null
      let index = 0

      const snapshots = rows.map(row => {
        index++

        if (
          lastScoreTotal !== null &&
          (
            row.scoreTotal !== lastScoreTotal ||
            row.scoreRound !== lastScoreRound ||
            row.totalDoubles !== lastTotalDoubles ||
            row.totalSuperDoubles !== lastTotalSuperDoubles
          )
        ) {
          currentPosition = index
        }

        lastScoreTotal = row.scoreTotal
        lastScoreRound = row.scoreRound
        lastTotalDoubles = row.totalDoubles
        lastTotalSuperDoubles = row.totalSuperDoubles

        return {
          roundId,
          userId: row.userId,
          scoreTotal: row.scoreTotal,
          scoreRound: row.scoreRound,
          totalDoubles: row.totalDoubles,
          totalSuperDoubles: row.totalSuperDoubles,
          position: currentPosition,
          snapshotType: 'GLOBAL',
          periodRef
        }
      })

      /**
       * 9️⃣ persistência
       */
      await tx.rankingSnapshot.createMany({
        data: snapshots
      })

    })

  }

}
