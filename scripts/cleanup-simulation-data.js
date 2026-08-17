#!/usr/bin/env node

const SIMULATION_EMAIL_DOMAIN = '@simulation.fantasy12.test'
const SIMULATION_NAME_PATTERN = /^\[(?:SIM|SIM6|SCORETEST)\s/i
const APPLY_CONFIRMATION = 'DELETE_SIMULATION_DATA'

function isSimulationIdentity(user) {
  return String(user?.email || '').toLowerCase().endsWith(SIMULATION_EMAIL_DOMAIN) ||
    SIMULATION_NAME_PATTERN.test(String(user?.name || ''))
}

function assertCleanupConfirmation(apply, env = process.env) {
  if (apply && env.F12_SIMULATION_CLEANUP_CONFIRMATION !== APPLY_CONFIRMATION) {
    throw new Error(`Confirme a limpeza com F12_SIMULATION_CLEANUP_CONFIRMATION=${APPLY_CONFIRMATION}`)
  }
}

function isSafeSimulationRound(round, simulationIds) {
  const belongsToSimulation = row => simulationIds.has(row.userId)
  return round.tickets.length > 0 &&
    round.tickets.every(belongsToSimulation) &&
    round.scoreHistory.every(belongsToSimulation) &&
    round.rankingSnapshots.every(belongsToSimulation) &&
    round.roundBenefits.every(belongsToSimulation) &&
    round.matches.length === 0
}

async function inspectSimulationData(tx) {
  const users = (await tx.user.findMany({
    where: {
      OR: [
        { email: { endsWith: SIMULATION_EMAIL_DOMAIN, mode: 'insensitive' } },
        { name: { startsWith: '[SIM ', mode: 'insensitive' } },
        { name: { startsWith: '[SIM6 ', mode: 'insensitive' } },
        { name: { startsWith: '[SCORETEST ', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: 'asc' },
  })).filter(isSimulationIdentity)
  const userIds = users.map(user => user.id)
  const simulationIds = new Set(userIds)

  if (userIds.length === 0) {
    return {
      users: [],
      userIds: [],
      simulationRankingIds: [],
      affectedRankingIds: [],
      safeRoundIds: [],
      unsafeRoundIds: [],
      blockedReferences: { nonBolaoCreated: 0, adminRoles: 0, adminAudits: 0 },
    }
  }

  const [simulationRankings, affectedParticipants, candidateRounds, nonBolaoCreated,
    adminRoles, adminAudits] = await Promise.all([
    tx.ranking.findMany({
      where: {
        type: 'BOLAO',
        OR: [
          { createdByUserId: { in: userIds } },
          { name: { startsWith: '[SIM ', mode: 'insensitive' } },
          { name: { startsWith: '[SIM6 ', mode: 'insensitive' } },
          { name: { startsWith: '[SCORETEST ', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    }),
    tx.rankingParticipant.findMany({
      where: { userId: { in: userIds } },
      distinct: ['rankingId'],
      select: { rankingId: true },
    }),
    tx.round.findMany({
      where: { tickets: { some: { userId: { in: userIds } } } },
      select: {
        id: true,
        tickets: { select: { userId: true } },
        scoreHistory: { select: { userId: true } },
        rankingSnapshots: { select: { userId: true } },
        roundBenefits: { select: { userId: true } },
        matches: { select: { id: true } },
      },
    }),
    tx.ranking.count({
      where: { createdByUserId: { in: userIds }, type: { not: 'BOLAO' } },
    }),
    tx.userAdminRole.count({ where: { userId: { in: userIds } } }),
    tx.adminAuditLog.count({ where: { adminId: { in: userIds } } }),
  ])

  const safeRounds = candidateRounds.filter(round =>
    isSafeSimulationRound(round, simulationIds)
  )
  const safeRoundIds = safeRounds.map(round => round.id)
  const safeRoundIdSet = new Set(safeRoundIds)

  return {
    users,
    userIds,
    simulationRankingIds: simulationRankings.map(ranking => ranking.id),
    affectedRankingIds: affectedParticipants.map(item => item.rankingId),
    safeRoundIds,
    unsafeRoundIds: candidateRounds
      .filter(round => !safeRoundIdSet.has(round.id))
      .map(round => round.id),
    blockedReferences: { nonBolaoCreated, adminRoles, adminAudits },
  }
}

function summarize(inventory, apply) {
  return {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    users: inventory.users.length,
    simulationRankings: inventory.simulationRankingIds.length,
    affectedRankings: inventory.affectedRankingIds.length,
    removableRounds: inventory.safeRoundIds.length,
    preservedMixedRounds: inventory.unsafeRoundIds.length,
    blockedReferences: inventory.blockedReferences,
    simulationUserIds: inventory.userIds,
    simulationRankingIds: inventory.simulationRankingIds,
    removableRoundIds: inventory.safeRoundIds,
    preservedMixedRoundIds: inventory.unsafeRoundIds,
  }
}

async function compactAffectedRankings(tx, rankingIds) {
  if (rankingIds.length === 0) return 0
  const {
    RankingTiebreakService,
  } = require('../dist/services/ranking/ranking-tiebreak.service')
  let updated = 0

  for (const rankingId of [...new Set(rankingIds)]) {
    const participants = await tx.rankingParticipant.findMany({
      where: { rankingId, status: 'APPROVED' },
      select: {
        id: true,
        userId: true,
        score: true,
        tiebreakSuperDoubleHits: true,
        tiebreakDoubleHits: true,
        tiebreakUserCreatedAt: true,
        user: { select: { createdAt: true } },
      },
    })
    const ranked = RankingTiebreakService.rank(participants, participant => ({
      userId: participant.userId,
      scoreRanking: participant.score,
      superDoubleHits: participant.tiebreakSuperDoubleHits,
      doubleHits: participant.tiebreakDoubleHits,
      userCreatedAt: participant.tiebreakUserCreatedAt ?? participant.user.createdAt,
    }))
    for (const participant of ranked) {
      await tx.rankingParticipant.update({
        where: { id: participant.id },
        data: { position: participant.position },
      })
      updated += 1
    }
  }
  return updated
}

async function cleanupSimulationData(prisma, { apply = false, env = process.env } = {}) {
  assertCleanupConfirmation(apply, env)

  const run = async tx => {
    const inventory = await inspectSimulationData(tx)
    const blocked = Object.values(inventory.blockedReferences).some(count => count > 0)
    if (apply && blocked) {
      throw new Error(`Limpeza bloqueada por referencias administrativas: ${JSON.stringify(inventory.blockedReferences)}`)
    }
    if (!apply || inventory.userIds.length === 0) {
      return { ...summarize(inventory, apply), deleted: false }
    }

    await tx.ranking.deleteMany({ where: { id: { in: inventory.simulationRankingIds } } })
    await tx.rankingParticipant.updateMany({
      where: { approvedByUserId: { in: inventory.userIds } },
      data: { approvedByUserId: null },
    })
    await tx.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: inventory.userIds } },
          { action: { in: ['COMPETITION_SIMULATION_CREATED'] } },
        ],
      },
    })
    await tx.round.deleteMany({ where: { id: { in: inventory.safeRoundIds } } })
    const deletedUsers = await tx.user.deleteMany({ where: { id: { in: inventory.userIds } } })
    const compactedParticipants = await compactAffectedRankings(
      tx,
      inventory.affectedRankingIds.filter(id => !inventory.simulationRankingIds.includes(id))
    )
    const result = {
      ...summarize(inventory, apply),
      deleted: true,
      deletedUsers: deletedUsers.count,
      compactedParticipants,
      backup: env.F12_SIMULATION_CLEANUP_BACKUP || null,
    }
    await tx.auditLog.create({
      data: {
        action: 'SIMULATION_DATA_CLEANED',
        entity: 'SYSTEM',
        metadata: result,
      },
    })
    return result
  }

  return apply ? prisma.$transaction(run, { timeout: 120000 }) : run(prisma)
}

async function main() {
  const apply = process.argv.includes('--apply')
  const { prisma } = require('../dist/lib/prisma')
  try {
    const result = await cleanupSimulationData(prisma, { apply })
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = {
  assertCleanupConfirmation,
  cleanupSimulationData,
  inspectSimulationData,
  isSafeSimulationRound,
  isSimulationIdentity,
}
