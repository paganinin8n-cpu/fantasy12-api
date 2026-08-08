const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const path = require('node:path')
const test = require('node:test')

const projectRoot = path.resolve(__dirname, '..')

test('redacts Redis AUTH arguments from structured errors', () => {
  const secret = 'synthetic-redis-secret-never-log'
  const source = [
    "const { logger } = require('./dist/lib/logger')",
    "const err = new Error('WRONGPASS')",
    `err.command = { name: 'auth', args: ['${secret}'] }`,
    "logger.error({ err }, 'Redis authentication failed')",
  ].join(';')

  const result = spawnSync(process.execPath, ['-e', source], {
    cwd: projectRoot,
    env: { ...process.env, NODE_ENV: 'production' },
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.includes(secret), false)

  const record = JSON.parse(result.stdout.trim())
  assert.equal(record.err.command.name, 'auth')
  assert.equal(record.err.command.args, '[redacted]')
})
