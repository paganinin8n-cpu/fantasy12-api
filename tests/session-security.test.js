const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const {
  RedisSessionStore,
} = require('../dist/lib/redis-session-store')
const {
  createSessionLifetimeMiddleware,
  establishAuthenticatedSession,
  sessionCookieOptions,
} = require('../dist/lib/session-security')

class FakeRedis {
  constructor() {
    this.values = new Map()
    this.sets = new Map()
    this.ttls = new Map()
  }

  async get(key) {
    return this.values.get(key) ?? null
  }

  async set(key, value, mode, ttl) {
    this.values.set(key, value)
    if (mode === 'EX') this.ttls.set(key, ttl)
    return 'OK'
  }

  async del(...keys) {
    for (const key of keys) {
      this.values.delete(key)
      this.sets.delete(key)
    }
    return keys.length
  }

  async sadd(key, value) {
    const values = this.sets.get(key) ?? new Set()
    values.add(value)
    this.sets.set(key, values)
    return 1
  }

  async srem(key, value) {
    this.sets.get(key)?.delete(value)
    return 1
  }

  async smembers(key) {
    return [...(this.sets.get(key) ?? [])]
  }

  async expire(key, ttl) {
    this.ttls.set(key, ttl)
    return 1
  }
}

function callStore(store, method, ...args) {
  return new Promise((resolve, reject) => {
    store[method](...args, (error, value) => {
      if (error) reject(error)
      else resolve(value)
    })
  })
}

test('Redis store shares sessions and revokes every session for a user', async () => {
  const redis = new FakeRedis()
  const store = new RedisSessionStore(redis, { idleTtlSeconds: 1800 })
  const session = {
    cookie: { maxAge: 1_800_000 },
    user: { id: 'user-1', sessionVersion: 3 },
  }

  await callStore(store, 'set', 'sid-1', session)
  await callStore(store, 'set', 'sid-2', session)

  assert.deepEqual(await callStore(store, 'get', 'sid-1'), session)
  assert.equal(redis.ttls.get('f12:session:sid-1'), 1800)

  await store.revokeUserSessions('user-1')

  assert.equal(await callStore(store, 'get', 'sid-1'), undefined)
  assert.equal(await callStore(store, 'get', 'sid-2'), undefined)
  assert.deepEqual(await redis.smembers('f12:user-sessions:user-1'), [])
})

test('authenticated login regenerates the session before saving identity', async () => {
  const events = []
  const req = {
    session: {
      regenerate(callback) {
        events.push('regenerate')
        req.session = {
          save(saveCallback) {
            events.push('save')
            saveCallback()
          },
        }
        callback()
      },
    },
  }

  await establishAuthenticatedSession(
    req,
    { id: 'user-1', role: 'NORMAL', email: 'user@example.com', sessionVersion: 4 },
    60_000,
    () => 1_000
  )

  assert.deepEqual(events, ['regenerate', 'save'])
  assert.equal(req.session.user.id, 'user-1')
  assert.equal(req.session.user.sessionVersion, 4)
  assert.equal(req.session.absoluteExpiresAt, 61_000)
})

test('absolute expiration destroys an authenticated session', async () => {
  let destroyed = false
  const req = {
    session: {
      user: { id: 'user-1' },
      absoluteExpiresAt: 999,
      destroy(callback) {
        destroyed = true
        callback()
      },
    },
  }
  const res = {
    statusCode: 200,
    body: null,
    clearCookie() {},
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
  let nextCalled = false

  await createSessionLifetimeMiddleware({ now: () => 1_000 })(
    req,
    res,
    () => {
      nextCalled = true
    }
  )

  assert.equal(destroyed, true)
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 401)
  assert.equal(res.body.error, 'session_expired')
})

test('logout cookie attributes match the creation attributes', () => {
  assert.deepEqual(
    sessionCookieOptions({
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
      COOKIE_SAME_SITE: 'none',
      SESSION_IDLE_TTL_MIN: '30',
    }),
    {
      httpOnly: true,
      maxAge: 1_800_000,
      path: '/',
      sameSite: 'none',
      secure: true,
    }
  )
})

test('password changes and administrative block advance session version and revoke Redis sessions', () => {
  const root = path.resolve(__dirname, '..')
  const resetSource = fs.readFileSync(
    path.join(root, 'src/services/auth/reset-password.service.ts'),
    'utf8'
  )
  const changeSource = fs.readFileSync(
    path.join(root, 'src/services/user/change-password.service.ts'),
    'utf8'
  )
  const adminSource = fs.readFileSync(
    path.join(root, 'src/services/admin/admin-user-management.service.ts'),
    'utf8'
  )

  for (const source of [resetSource, changeSource, adminSource]) {
    assert.match(source, /sessionVersion:\s*\{\s*increment:\s*1\s*\}/)
    assert.match(source, /revokeUserSessions/)
  }
})

test('login no longer creates or returns an unused JWT', () => {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/services/auth/login.service.ts'),
    'utf8'
  )

  assert.doesNotMatch(source, /generateToken|token,/) 
})
