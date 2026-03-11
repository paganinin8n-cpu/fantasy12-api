import { prisma } from '../../lib/prisma'

type SnapshotRow = {
  userId: string
  scoreTotal: number
  scoreRound: number
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
          number: true
        }
      })

      if (!round) {
        throw new Error('Round not found')
      }

      if (round.status !== 'SCORED') {
        throw new Error('Snapshot can only be generated for SCORED rounds')
      }

      /**
       * 2️⃣ idempotência
       */
      const snapshotExists = await tx.rankingSnapshot.findFirst({
        where: { roundId },
        select: { id: true }
      })

      if (snapshotExists) {
        throw new Error('Snapshot already generated for this round')
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
      const history = await tx.userScoreHistory.groupBy({
        by: ['userId'],
        where: {
          roundId: { in: validRoundIds }
        },
        _max: {
          scoreTotal: true
        }
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
      const rows: SnapshotRow[] = history.map(h => ({
        userId: h.userId,
        scoreTotal: h._max.scoreTotal ?? 0,
        scoreRound: roundScoreMap.get(h.userId) ?? 0
      }))

      /**
       * 7️⃣ ordenação oficial
       */
      rows.sort((a, b) => {

        if (b.scoreTotal !== a.scoreTotal) {
          return b.scoreTotal - a.scoreTotal
        }

        if (b.scoreRound !== a.scoreRound) {
          return b.scoreRound - a.scoreRound
        }

        return a.userId.localeCompare(b.userId)

      })

      /**
       * 8️⃣ calcular posições com empate
       */
      let currentPosition = 1
      let lastScoreTotal: number | null = null
      let lastScoreRound: number | null = null
      let index = 0

      const snapshots = rows.map(row => {

        index++

        if (
          lastScoreTotal !== null &&
          (
            row.scoreTotal !== lastScoreTotal ||
            row.scoreRound !== lastScoreRound
          )
        ) {
          currentPosition = index
        }

        lastScoreTotal = row.scoreTotal
        lastScoreRound = row.scoreRound

        return {
          roundId,
          userId: row.userId,
          scoreTotal: row.scoreTotal,
          scoreRound: row.scoreRound,
          position: currentPosition,
          snapshotType: 'GLOBAL',
          periodRef: null
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