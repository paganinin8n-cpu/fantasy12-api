const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const policy = JSON.parse(
  fs.readFileSync(path.join(root, 'config/security-route-policy.json'), 'utf8')
)
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete'])

function routeKey(route) {
  return `${route.file}|${route.method}|${route.path}`
}

function readRoutes(file) {
  const absolutePath = path.join(root, file)
  const source = fs.readFileSync(absolutePath, 'utf8')
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
  const routes = []

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'router' &&
      httpMethods.has(node.expression.name.text) &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const args = [...node.arguments].slice(1)
      const authorizeCall = args.find(
        arg =>
          ts.isCallExpression(arg) &&
          ts.isIdentifier(arg.expression) &&
          arg.expression.text === 'authorize'
      )
      routes.push({
        file,
        method: node.expression.name.text,
        path: node.arguments[0].text,
        middleware: args
          .filter(ts.isIdentifier)
          .map(identifier => identifier.text),
        permission:
          authorizeCall && ts.isStringLiteral(authorizeCall.arguments[0])
            ? authorizeCall.arguments[0].text
            : null,
      })
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return routes
}

test('matriz canônica protege todas as rotas administrativas e internas', () => {
  assert.equal(policy.schemaVersion, 1)
  const expected = new Map()
  for (const route of policy.routes) {
    const key = routeKey(route)
    assert.equal(expected.has(key), false, `rota duplicada na matriz: ${key}`)
    expected.set(key, route)
  }

  const files = [...new Set(policy.routes.map(route => route.file))]
  const discovered = files
    .flatMap(readRoutes)
    .filter(
      route =>
        route.path.startsWith('/admin') ||
        route.path.includes('/admin/') ||
        route.file === 'src/routes/internal.routes.ts'
    )

  assert.equal(discovered.length, policy.routes.length)
  for (const route of discovered) {
    const key = routeKey(route)
    const rule = expected.get(key)
    assert.ok(rule, `rota sensível sem regra: ${key}`)
    assert.ok(
      route.middleware.includes(rule.auth),
      `${key} perdeu ${rule.auth}`
    )
    assert.equal(
      route.permission,
      rule.permission,
      `${key} perdeu ou alterou a permissão`
    )
  }
})
