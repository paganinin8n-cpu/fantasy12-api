import { prisma } from '../../lib/prisma'

export class RecalculateRankingService {

  static async execute(): Promise<void> {

    await prisma.$executeRawUnsafe(`

      UPDATE ranking_participants rp
      SET position = ranked.position
      FROM (
        SELECT
          ush.user_id,
          RANK() OVER (ORDER BY ush.score_total DESC) AS position
        FROM user_score_history ush
      ) ranked
      WHERE rp.user_id = ranked.user_id

    `)

  }

}