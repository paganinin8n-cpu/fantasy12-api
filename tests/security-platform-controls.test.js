const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const helmet = require('helmet')

function response() {
  return {
    headers: {},
    headersSent: false,
    writableEnded: false,
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value
    },
    removeHeader(name) {
      delete this.headers[name.toLowerCase()]
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()]
    },
    status(code) {
      this.statusCode = code
      return this
    },
    send(body) {
      this.body = body
      this.writableEnded = true
      return this
    },
  }
}

test('helmet entrega headers defensivos e permanece ligado no bootstrap', () => {
  const res = response()
  let nextCalled = false
  helmet({ crossOriginResourcePolicy: false })(
    { headers: {} },
    res,
    () => {
      nextCalled = true
    }
  )
  assert.equal(nextCalled, true)
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
  assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN')
  assert.ok(res.headers['content-security-policy'])
  assert.ok(res.headers['strict-transport-security'])

  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/index.ts'),
    'utf8'
  )
  assert.match(source, /app\.use\(\s*helmet\(/)
  assert.match(source, /globalRateLimiter/)
})

test('rate limit global bloqueia excesso e publica headers padrão', async t => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalLimit = process.env.RATE_LIMIT_MAX
  process.env.NODE_ENV = 'production'
  process.env.RATE_LIMIT_MAX = '2'
  const modulePath = require.resolve('../dist/middleware/rate-limit.middleware')
  delete require.cache[modulePath]
  const { globalRateLimiter } = require(modulePath)
  t.after(() => {
    process.env.NODE_ENV = originalNodeEnv
    process.env.RATE_LIMIT_MAX = originalLimit
    delete require.cache[modulePath]
  })

  async function attempt() {
    const req = {
      app: { get: () => 1 },
      headers: {},
      ip: '203.0.113.10',
      method: 'GET',
      originalUrl: '/',
      socket: { remoteAddress: '203.0.113.10' },
    }
    const res = response()
    let nextCalled = false
    await globalRateLimiter(req, res, () => {
      nextCalled = true
    })
    return { nextCalled, res }
  }

  const first = await attempt()
  const second = await attempt()
  const third = await attempt()
  assert.equal(first.nextCalled, true)
  assert.equal(second.nextCalled, true)
  assert.equal(third.nextCalled, false)
  assert.equal(third.res.statusCode, 429)
  assert.ok(first.res.headers['ratelimit-policy'])
  assert.ok(third.res.headers['ratelimit-reset'])
})

test('workflow publica relatório e bloqueia deploy antes dos gates', () => {
  const workflow = fs.readFileSync(
    path.resolve(__dirname, '../.github/workflows/deploy.yml'),
    'utf8'
  )
  assert.match(workflow, /pull_request:\s*\n\s*branches: \[main\]/)
  assert.match(workflow, /run: npm run ci:check/)
  assert.match(workflow, /uses: actions\/upload-artifact@v4/)
  assert.match(workflow, /path: \.artifacts\/security-gates\.json/)
  assert.match(workflow, /docker-build:[\s\S]+needs: ci/)
  assert.match(workflow, /deploy:[\s\S]+needs: \[ci, docker-build\]/)
})

test('gate de migrations usa baseline controlada, não modo relatório', () => {
  const pkg = require('../package.json')
  assert.match(
    pkg.scripts['prisma:schema:release:check'],
    /prisma:migrate:audit:chain:baseline/
  )
  assert.doesNotMatch(
    pkg.scripts['prisma:schema:release:check'],
    /prisma:migrate:audit:chain:report/
  )
  const baseline = require('../prisma/migration-audit-baseline.json')
  assert.equal(baseline.schemaVersion, 1)
  assert.equal(baseline.findingsCount, 0)
  assert.match(baseline.fingerprint, /^[a-f0-9]{64}$/)
})
