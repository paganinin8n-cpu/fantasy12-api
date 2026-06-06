const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')

const scanRoots = ['src', 'scripts'].map(dir => path.join(repoRoot, dir))

const allowedFiles = new Set([
  path.join(repoRoot, 'scripts', 'check-product-rule-policy.js'),
  path.join(repoRoot, 'src', 'domain', 'permissions.ts'),
  path.join(repoRoot, 'src', 'middleware', 'auth.middleware.ts'),
  path.join(repoRoot, 'src', 'middleware', 'requirePermission.ts'),
  path.join(repoRoot, 'src', 'middleware', 'requireRole.ts'),
  path.join(repoRoot, 'src', '@types', 'express.d.ts'),
])

const forbiddenPatterns = [
  {
    label: 'UserRole.PRO',
    regex: /\bUserRole\.PRO\b/,
  },
  {
    label: "role === 'PRO'",
    regex: /\brole\s*={0,2}=+\s*['"]PRO['"]/,
  },
  {
    label: "'PRO' role fallback",
    regex: /\buser\.role\s*={0,2}=+\s*['"]PRO['"]/,
  },
]

function walk(dir) {
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(absolute)
      if (!/\.(ts|js)$/.test(entry.name)) return []
      return [absolute]
    })
}

function main() {
  const findings = []

  for (const file of scanRoots.flatMap(walk)) {
    if (allowedFiles.has(file)) continue

    const source = fs.readFileSync(file, 'utf8')
    const lines = source.split('\n')

    lines.forEach((line, index) => {
      for (const pattern of forbiddenPatterns) {
        if (pattern.regex.test(line)) {
          findings.push({
            file: path.relative(repoRoot, file),
            line: index + 1,
            label: pattern.label,
          })
        }
      }
    })
  }

  if (findings.length > 0) {
    console.error('Product rule policy check failed.')
    console.error('PRO eligibility must come from Subscription, not User.role.')
    for (const finding of findings) {
      console.error(`- ${finding.file}:${finding.line} ${finding.label}`)
    }
    process.exit(1)
  }

  console.log('Product rule policy check passed.')
}

main()
