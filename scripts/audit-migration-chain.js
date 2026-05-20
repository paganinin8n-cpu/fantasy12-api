const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'prisma', 'migrations');

const requiredFreshTables = ['users', 'rounds', 'rankings', 'subscriptions'];
const tableRefRegex = /REFERENCES\s+"([^"]+)"/g;
const createTableRegex = /CREATE TABLE\s+"([^"]+)"/g;
const createTypeRegex = /CREATE TYPE\s+"([^"]+)"/g;
const alterTableRegex = /ALTER TABLE\s+"([^"]+)"/g;

function readMigrationDirectories() {
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function collectMatches(regex, source) {
  const values = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    values.push(match[1]);
  }
  return values;
}

function main() {
  const reportOnly = process.argv.includes('--report-only');
  const directories = readMigrationDirectories();
  const findings = [];
  const createdTables = new Set();
  const createdTypes = new Set();

  directories.forEach((dirName, index) => {
    const filePath = path.join(migrationsDir, dirName, 'migration.sql');

    if (!fs.existsSync(filePath)) {
      findings.push({
        severity: 'warn',
        migration: dirName,
        message: 'migration.sql ausente',
      });
      return;
    }

    const raw = fs.readFileSync(filePath);
    const hasNullBytes = raw.includes(0);
    const source = hasNullBytes ? raw.toString('utf16le') : raw.toString('utf8');
    const trimmed = source.trim();

    if (index === 0 && !/CREATE TABLE|CREATE TYPE|ALTER TABLE/i.test(source)) {
      findings.push({
        severity: 'error',
        migration: dirName,
        message: 'baseline inicial nao cria estrutura nenhuma',
      });
    }

    if (!trimmed) {
      findings.push({
        severity: 'warn',
        migration: dirName,
        message: 'migration vazia',
      });
    }

    if (hasNullBytes) {
      findings.push({
        severity: 'warn',
        migration: dirName,
        message: 'arquivo com bytes nulos; provavelmente UTF-16LE',
      });
    }

    const tablesCreatedInThisMigration = collectMatches(createTableRegex, source);
    const typesCreatedInThisMigration = collectMatches(createTypeRegex, source);
    const alteredTables = collectMatches(alterTableRegex, source);
    const referencedTables = collectMatches(tableRefRegex, source);

    alteredTables.forEach((tableName) => {
      if (
        !createdTables.has(tableName) &&
        !tablesCreatedInThisMigration.includes(tableName)
      ) {
        findings.push({
          severity: 'error',
          migration: dirName,
          message: `ALTER TABLE em "${tableName}" antes de a cadeia criar essa tabela`,
        });
      }
    });

    referencedTables.forEach((tableName) => {
      if (
        !createdTables.has(tableName) &&
        !tablesCreatedInThisMigration.includes(tableName)
      ) {
        findings.push({
          severity: 'error',
          migration: dirName,
          message: `FK referencia "${tableName}" antes de a cadeia criar essa tabela`,
        });
      }
    });

    if (source.includes('"PaymentProvider"') && !createdTypes.has('PaymentProvider')) {
      if (!typesCreatedInThisMigration.includes('PaymentProvider')) {
        findings.push({
          severity: 'error',
          migration: dirName,
          message: 'usa enum "PaymentProvider" antes de a cadeia criar esse tipo',
        });
      }
    }

    tablesCreatedInThisMigration.forEach((name) => createdTables.add(name));
    typesCreatedInThisMigration.forEach((name) => createdTypes.add(name));
  });

  requiredFreshTables.forEach((tableName) => {
    if (!createdTables.has(tableName)) {
      findings.push({
        severity: 'error',
        migration: 'chain',
        message: `a cadeia inteira nao cria a tabela obrigatoria "${tableName}"`,
      });
    }
  });

  const errors = findings.filter((item) => item.severity === 'error');
  const warnings = findings.filter((item) => item.severity === 'warn');

  console.log('=== Audit da trilha de migrations ===');
  console.log(`Migrations analisadas: ${directories.length}`);
  console.log(`Erros: ${errors.length}`);
  console.log(`Avisos: ${warnings.length}`);
  console.log('');

  findings.forEach((finding) => {
    const prefix = finding.severity === 'error' ? '[ERRO]' : '[AVISO]';
    console.log(`${prefix} ${finding.migration}: ${finding.message}`);
  });

  if (errors.length > 0 && !reportOnly) {
    process.exitCode = 1;
  }
}

main();
