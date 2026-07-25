const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const repoRoot = path.resolve(__dirname, '..')
const reportPath = path.resolve(
  repoRoot,
  process.env.SECURITY_GATE_REPORT_FILE ?? '.artifacts/security-gates.json'
)
const gates = [
  'security:audit',
  'prisma:schema:release:check',
  'test:competition',
  'test:payments',
  'test:benefits',
  'test:worker',
  'test:teams',
  'test:security',
]

const results = []
let failed = false

for (const gate of gates) {
  if (failed) {
    results.push({ gate, status: 'skipped' })
    continue
  }
  const result = spawnSync('npm', ['run', gate], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  })
  const passed = result.status === 0
  results.push({ gate, status: passed ? 'passed' : 'failed' })
  failed = !passed
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(
  reportPath,
  `${JSON.stringify({ schemaVersion: 1, gates: results }, null, 2)}\n`
)
console.log(`Security gate report: ${path.relative(repoRoot, reportPath)}`)

if (failed) process.exitCode = 1
