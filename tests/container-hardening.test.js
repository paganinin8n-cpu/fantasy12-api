const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')

test('imagem usa Node LTS, multi-stage e usuário não-root', () => {
  const dockerfile = read('Dockerfile')
  assert.match(dockerfile, /FROM node:22-alpine AS build/)
  assert.match(dockerfile, /FROM node:22-alpine AS runtime/)
  assert.match(dockerfile, /npm prune --omit=dev/)
  assert.match(dockerfile, /usr\/local\/lib\/node_modules\/npm/)
  assert.match(dockerfile, /COPY --from=build --chown=node:node/)
  assert.match(dockerfile, /\nUSER node\n/)
  assert.match(dockerfile, /HEALTHCHECK[\s\S]+\/health/)
  assert.doesNotMatch(dockerfile, /FROM node:20/)
})

test('Prisma CLI é operacional e ferramentas de build continuam dev-only', () => {
  const pkg = require('../package.json')
  assert.ok(pkg.dependencies.prisma)
  assert.equal(pkg.devDependencies.prisma, undefined)
  for (const dependency of ['typescript', 'ts-node-dev', 'pino-pretty']) {
    assert.ok(pkg.devDependencies[dependency])
    assert.equal(pkg.dependencies[dependency], undefined)
  }
  assert.equal(pkg.engines.node, '>=22 <23')
})

test('CI verifica conteúdo, escaneia a imagem e valida o runtime produtivo', () => {
  const workflow = read('.github/workflows/deploy.yml')
  assert.match(workflow, /NODE_VERSION: '22'/)
  assert.match(workflow, /verify-container-hardening\.sh/)
  assert.match(workflow, /aquasec\/trivy:0\.65\.0 image/)
  assert.match(workflow, /--exit-code 1/)
  assert.match(workflow, /--ignore-unfixed=false/)
  assert.match(workflow, /--pkg-types os,library/)
  assert.match(workflow, /--severity HIGH,CRITICAL/)
  assert.match(workflow, /Verify production runtime hardening/)
  assert.match(workflow, /docker exec "\$API_CONTAINER" id -u/)
})

test('verificação da imagem cobre API, worker, Prisma e dependências dev', () => {
  const verifier = read('scripts/verify-container-hardening.sh')
  assert.match(verifier, /id -u/)
  assert.match(verifier, /dist\/index\.js/)
  assert.match(verifier, /dist\/worker\.js/)
  assert.match(verifier, /node_modules\/\.bin\/prisma/)
  assert.match(verifier, /usr\/local\/bin\/npm/)
  assert.match(verifier, /usr\/local\/bin\/npx/)
  assert.match(verifier, /node_modules\/typescript/)
  assert.match(verifier, /node_modules\/ts-node-dev/)
  assert.match(verifier, /node_modules\/pino-pretty/)
})
