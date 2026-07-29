export const RANKING_TIEBREAK_RULE_VERSION = 'v2'

export type RankingTiebreakMetrics = {
  userId: string
  scoreRanking: number
  superDoubleHits: number
  doubleHits: number
  userCreatedAt: Date
}

type AccumulatedHits = {
  totalSuperDoubles: number
  totalDoubles: number
}

export class RankingTiebreakService {
  static compare(
    a: RankingTiebreakMetrics,
    b: RankingTiebreakMetrics
  ) {
    if (b.scoreRanking !== a.scoreRanking) {
      return b.scoreRanking - a.scoreRanking
    }
    if (b.superDoubleHits !== a.superDoubleHits) {
      return b.superDoubleHits - a.superDoubleHits
    }
    if (b.doubleHits !== a.doubleHits) {
      return b.doubleHits - a.doubleHits
    }

    const createdAtDifference =
      a.userCreatedAt.getTime() - b.userCreatedAt.getTime()
    if (createdAtDifference !== 0) return createdAtDifference

    // Estabilidade técnica: userId não altera a posição em empate absoluto.
    return a.userId.localeCompare(b.userId)
  }

  static sameOfficialPosition(
    a: RankingTiebreakMetrics,
    b: RankingTiebreakMetrics
  ) {
    return (
      a.scoreRanking === b.scoreRanking &&
      a.superDoubleHits === b.superDoubleHits &&
      a.doubleHits === b.doubleHits &&
      a.userCreatedAt.getTime() === b.userCreatedAt.getTime()
    )
  }

  static rank<T>(
    rows: T[],
    metricsFor: (row: T) => RankingTiebreakMetrics
  ): Array<T & { position: number }> {
    const sorted = [...rows].sort((a, b) =>
      this.compare(metricsFor(a), metricsFor(b))
    )

    let position = 1
    return sorted.map((row, index) => {
      if (
        index > 0 &&
        !this.sameOfficialPosition(
          metricsFor(row),
          metricsFor(sorted[index - 1])
        )
      ) {
        position = index + 1
      }

      return { ...row, position }
    })
  }

  static calculateWindowHits(
    current: AccumulatedHits | null | undefined,
    baseline: AccumulatedHits | null | undefined
  ) {
    return {
      superDoubleHits:
        (current?.totalSuperDoubles ?? 0) -
        (baseline?.totalSuperDoubles ?? 0),
      doubleHits:
        (current?.totalDoubles ?? 0) -
        (baseline?.totalDoubles ?? 0),
    }
  }
}
