# Auditoria da trilha de migrations

## Estado atual

A trilha ativa do `fantasy12-api` começa em uma baseline consolidada:

```text
20260730000000_fantasy12_baseline_v2
```

Ela cria o schema completo do zero e inclui invariantes que não são
representáveis no `schema.prisma`, como:

- índice parcial que permite somente uma rodada `OPEN`;
- constraints de saldos e benefícios não negativos;
- email canônico;
- integridade dos limites de convites de Bolão.

Por isso, bancos vazios e bancos existentes usam a mesma operação:

```sh
npm run prisma:migrate:deploy
```

## Histórico anterior

As 35 migrations anteriores foram removidas da pasta ativa porque começavam
com uma baseline vazia e pressupunham tabelas preexistentes. O histórico
permanece recuperável no Git e no manifesto:

```text
prisma/migration-baseline-cutover-v2.json
```

A base existente recebeu apenas uma troca controlada dos registros de
`_prisma_migrations`. Nenhum SQL da baseline consolidada foi executado sobre
as tabelas existentes.

## Proteções do corte

O script `scripts/rebaseline-migration-history.js`:

1. exige autorização explícita com o nome exato da baseline;
2. aceita somente o histórico legado previsto no manifesto;
3. valida tabelas, constraints e índices operacionais;
4. bloqueia `_prisma_migrations`;
5. grava um backup JSON do histórico;
6. registra a baseline e remove os registros legados na mesma transação;
7. compara o fingerprint estrutural antes e depois;
8. aborta a transação se qualquer estrutura da aplicação mudar.

O script é idempotente. Depois do corte, execuções futuras apenas confirmam
que a baseline já está consolidada.

## Baseline canônica do schema atual

O SQL gerado diretamente do Prisma continua versionado em:

```text
prisma/baselines/current-fresh-schema.sql
```

Ele representa o schema Prisma atual. A migration inicial consolidada é
imutável depois de aplicada; mudanças futuras devem ser novas migrations.

## Verificações

```sh
npm run prisma:migrate:audit:chain:baseline
npm run prisma:baseline:fresh:verify
npm run prisma:migration:policy:check
npm run prisma:schema:release:check
```

O resultado esperado para a auditoria da cadeia é zero erros e zero avisos.
