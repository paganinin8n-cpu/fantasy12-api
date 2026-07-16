const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function hasActiveProSubscription(subscription) {
  if (!subscription) return false
  if (subscription.status === 'EXPIRED') return false
  return !subscription.endAt || subscription.endAt > new Date()
}

function hasAnnualProSubscription(subscription) {
  return hasActiveProSubscription(subscription) && subscription.plan === 'ANNUAL'
}

function getRoundBenefitGrant(subscription) {
  if (!hasActiveProSubscription(subscription)) {
    return {
      freeDoubles: 2,
      freeSuperDoubles: 0,
    }
  }

  return hasAnnualProSubscription(subscription)
    ? {
        freeDoubles: 4,
        freeSuperDoubles: 2,
      }
    : {
        freeDoubles: 4,
        freeSuperDoubles: 2,
      }
}

async function main() {
  const round = await prisma.round.findFirst({
    where: { status: 'OPEN' },
    orderBy: { openAt: 'desc' },
    select: { id: true, number: true },
  })

  if (!round) {
    console.log('No OPEN round found. Nothing to regrant.')
    return
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      subscription: {
        select: {
          status: true,
          plan: true,
          endAt: true,
        },
      },
    },
  })

  let normalUsers = 0
  let proUsers = 0

  for (const user of users) {
    const isPro = hasActiveProSubscription(user.subscription)
    const { freeDoubles, freeSuperDoubles } = getRoundBenefitGrant(user.subscription)

    if (isPro) proUsers += 1
    else normalUsers += 1

    await prisma.roundBenefit.upsert({
      where: {
        userId_roundId: {
          userId: user.id,
          roundId: round.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roundId: round.id,
        freeDoubles,
        freeSuperDoubles,
      },
    })
  }

  console.log(
    `Regranted benefits for round ${round.number} (${round.id}): ${normalUsers} normal, ${proUsers} pro.`
  )
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
