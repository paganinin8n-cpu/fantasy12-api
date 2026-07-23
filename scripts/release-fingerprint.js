const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const productionInputs = [
  'Dockerfile',
  'package-lock.json',
  'package.json',
  'prisma',
  'scripts',
  'src',
  'tsconfig.json',
]

function collectFiles(relativePath, files) {
  const absolutePath = path.join(projectRoot, relativePath)
  const stat = fs.statSync(absolutePath)

  if (stat.isFile()) {
    files.push(relativePath)
    return
  }

  for (const entry of fs.readdirSync(absolutePath)) {
    collectFiles(path.join(relativePath, entry), files)
  }
}

const files = []
for (const input of productionInputs) collectFiles(input, files)

const hash = crypto.createHash('sha256')
for (const file of files.sort()) {
  hash.update(file)
  hash.update('\0')
  hash.update(fs.readFileSync(path.join(projectRoot, file)))
  hash.update('\0')
}

process.stdout.write(`${hash.digest('hex')}\n`)
