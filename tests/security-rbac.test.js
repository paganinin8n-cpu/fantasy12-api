const assert = require('node:assert/strict')
const test = require('node:test')

const { prisma } = require('../dist/lib/prisma')
const { authorize } = require('../dist/middleware/authorize.middleware')

function response() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
  }
}

async function execute(userId) {
  const req = {
    user: { id: userId, role: 'ADMIN' },
    method: 'POST',
    originalUrl: '/api/admin/monetization/wallet/target/credit',
    params: { userId: 'target' },
    ip: '127.0.0.1',
  }
  const res = response()
  let nextCalled = false
  await authorize('FINANCE_EXECUTE', {
    audit: true,
    entity: 'WALLET',
  })(req, res, () => { nextCalled = true })
  return { res, nextCalled }
}

test('RBAC diferencia usuário comum, admin sem permissão, admin autorizado e SUPERADMIN', async t => {
  const originalFindFirst = prisma.userAdminRole.findFirst
  const originalAuditCreate = prisma.adminAuditLog.create
  const audit = []

  prisma.userAdminRole.findFirst = async ({ where }) => {
    const id = where.userId
    if (id === 'authorized-admin' || id === 'superadmin') return { id: `role-${id}` }
    return null
  }
  prisma.adminAuditLog.create = async ({ data }) => {
    audit.push(data)
    return data
  }

  t.after(() => {
    prisma.userAdminRole.findFirst = originalFindFirst
    prisma.adminAuditLog.create = originalAuditCreate
  })

  for (const deniedUser of ['normal-user', 'admin-without-permission']) {
    const denied = await execute(deniedUser)
    assert.equal(denied.nextCalled, false)
    assert.equal(denied.res.statusCode, 403)
  }

  for (const allowedUser of ['authorized-admin', 'superadmin']) {
    const allowed = await execute(allowedUser)
    assert.equal(allowed.nextCalled, true)
    assert.equal(allowed.res.statusCode, null)
  }

  assert.deepEqual(
    audit.map(item => [item.adminId, item.action]),
    [
      ['normal-user', 'PERMISSION_DENIED'],
      ['admin-without-permission', 'PERMISSION_DENIED'],
      ['authorized-admin', 'PERMISSION_GRANTED'],
      ['superadmin', 'PERMISSION_GRANTED'],
    ]
  )
})

test('fechamento forçado de Mesa não usa User.role como bypass', () => {
  const fs = require('node:fs')
  const path = require('node:path')
  const source = fs.readFileSync(
    path.resolve(__dirname, '../src/services/bolao/close-bolao.service.ts'),
    'utf8'
  )
  assert.match(source, /hasAdminPermission\(requestedByUserId, 'COMPETITION_EXECUTE'\)/)
  assert.doesNotMatch(source, /requestingUser\?\.role === 'ADMIN'/)
  assert.match(source, /MESA_FORCE_SETTLEMENT_DENIED/)
  assert.match(source, /MESA_FORCE_SETTLEMENT_GRANTED/)
})
