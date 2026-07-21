const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const routes = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'routes', 'team.routes.ts'),
  'utf8'
)

test('listagem administrativa de times usa a permissão oficial de leitura', () => {
  assert.match(
    routes,
    /router\.get\('\/api\/admin\/teams',[\s\S]*?authorize\('COMPETITION_READ'\)/
  )
})

test('alterações administrativas de times usam a permissão oficial de escrita', () => {
  for (const method of ['post', 'put', 'delete']) {
    assert.match(
      routes,
      new RegExp(`router\\.${method}\\('\\/api\\/admin\\/teams[\\s\\S]*?authorize\\('COMPETITION_WRITE'\\)`)
    )
  }
  assert.doesNotMatch(routes, /ROUND_WRITE/)
})
