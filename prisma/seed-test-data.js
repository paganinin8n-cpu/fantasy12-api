const { PrismaClient, RoundStatus } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash('123456', 10)

  const user = await prisma.user.upsert({
    where: { email: 'admin@fantasy12.com' },
    update: {
      name: 'Admin',
      password: passwordHash,
      role: 'ADMIN',
    },
    create: {
      name: 'Admin',
      email: 'admin@fantasy12.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  const adminRole = await prisma.adminRole.findUnique({
    where: { name: 'ADMIN' },
    select: { id: true },
  })

  if (adminRole) {
    const existingUserAdminRole = await prisma.userAdminRole.findFirst({
      where: {
        userId: user.id,
        roleId: adminRole.id,
      },
      select: {
        id: true,
      },
    })

    if (!existingUserAdminRole) {
      await prisma.userAdminRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      })
    }
  }

  return user
}

async function ensureOpenRound() {
  const existingOpenRound = await prisma.round.findFirst({
    where: { status: RoundStatus.OPEN },
    orderBy: { number: 'desc' },
  })

  if (existingOpenRound) {
    return existingOpenRound
  }

  const lastRound = await prisma.round.findFirst({
    orderBy: { number: 'desc' },
    select: { number: true },
  })

  const now = new Date()
  const closeAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  return prisma.round.create({
    data: {
      number: (lastRound?.number ?? 0) + 1,
      status: RoundStatus.OPEN,
      openAt: now,
      closeAt,
      result: null,
    },
  })
}

async function main() {
  console.log('🔹 Seeding test admin and round')

  const admin = await ensureAdminUser()
  const round = await ensureOpenRound()

  console.log('✅ Test data seed concluído')
  console.log(`Admin: ${admin.email} / 123456`)
  console.log(`Round: #${round.number} (${round.status})`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
