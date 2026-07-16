require('dotenv').config()

const { prisma } = require('../dist/lib/prisma')
const { MesaIntegrityService } = require('../dist/services/bolao/mesa-integrity.service')

async function main() {
  const report = await MesaIntegrityService.diagnose(prisma)
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  if (report.affected > 0) process.exitCode = 2
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
