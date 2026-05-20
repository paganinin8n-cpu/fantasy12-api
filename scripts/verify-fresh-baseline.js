const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(repoRoot, 'prisma', 'schema.prisma');
const baselinePath = path.join(
  repoRoot,
  'prisma',
  'baselines',
  'current-fresh-schema.sql',
);

function normalizeSql(sql) {
  return sql.replace(/\r\n/g, '\n').trim();
}

function main() {
  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline ausente: ${baselinePath}`);
    console.error('Rode `npm run prisma:baseline:fresh:generate` primeiro.');
    process.exit(1);
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fantasy12-baseline-'));
  const tmpFile = path.join(tmpDir, 'generated-fresh-schema.sql');

  try {
    const sql = execFileSync(
      'npx',
      [
        'prisma',
        'migrate',
        'diff',
        '--from-empty',
        '--to-schema-datamodel',
        schemaPath,
        '--script',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    fs.writeFileSync(tmpFile, sql, 'utf8');

    const expected = normalizeSql(fs.readFileSync(baselinePath, 'utf8'));
    const generated = normalizeSql(fs.readFileSync(tmpFile, 'utf8'));

    if (expected !== generated) {
      console.error('Baseline fresh fora de sincronia com o schema atual.');
      console.error(
        'Rode `npm run prisma:baseline:fresh:generate` e versione o arquivo atualizado.',
      );
      process.exit(1);
    }

    console.log('Baseline fresh está alinhada com o schema atual.');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main();
