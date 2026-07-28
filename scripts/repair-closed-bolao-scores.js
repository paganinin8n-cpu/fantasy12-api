/**
 * Recomputa score/posição de Mesas CLOSED que ficaram com pontuação zerada
 * por falta de UserScoreHistory no fechamento.
 *
 * Uso:
 *   npm run build && node scripts/repair-closed-bolao-scores.js
 *   npm run build && node scripts/repair-closed-bolao-scores.js --apply
 */
require('dotenv').config()

const { prisma } = require('../dist/lib/prisma')
const {
  RankingWindowScoreService,
} = require('../dist/services/ranking/ranking-window-score.service')

const APPLY = process.argv.includes('--apply')

async function main() {
  const mesas = await prisma.ranking.findMany({
    where: { type: 'BOLAO', status: 'CLOSED' },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { endDate: 'desc' },
  })

  let changedParticipants = 0
  const summary = []

  for (const mesa of mesas) {
    const asOf =
      mesa.endDate != null
        ? new Date(mesa.endDate.getTime() + 1)
        : new Date()

    const rows = await RankingWindowScoreService.buildRows(prisma, mesa, asOf)
    const updates = []

    for (const row of rows) {
      if (row.previousScore === row.score && row.previousPosition === row.position) {
        continue
      }
      updates.push(row)
    }

    if (updates.length === 0) continue

    summary.push({
      id: mesa.id,
      name: mesa.name,
      updates: updates.map(row => ({
        userId: row.userId,
        from: row.previousScore,
        to: row.score,
        position: row.position,
      })),
    })

    if (!APPLY) continue

    await prisma.$transaction(async tx => {
      for (const row of updates) {
        await tx.rankingParticipant.update({
          where: { id: row.participantId },
          data: {
            score: row.score,
            position: row.position,
          },
        })
        await tx.auditLog.create({
          data: {
            userId: row.userId,
            action: 'RANKING_PARTICIPANT_SCORE_REPAIRED',
            entity: 'RANKING_PARTICIPANT',
            entityId: row.participantId,
            metadata: {
              rankingId: mesa.id,
              previousScore: row.previousScore,
              score: row.score,
              previousPosition: row.previousPosition,
              position: row.position,
              scoreInitial: row.scoreInitial,
              scoreTotalCurrent: row.scoreTotalCurrent,
              formula: 'scoreTotalCurrent - scoreInitial',
              reason: 'repair-closed-bolao-scores',
            },
          },
        })
        changedParticipants += 1
      }
    })
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: APPLY ? 'apply' : 'dry-run',
        mesasAffected: summary.length,
        participantsUpdated: changedParticipants,
        summary,
      },
      null,
      2
    )}\n`
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
