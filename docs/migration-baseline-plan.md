# Plano da baseline consolidada

## Objetivo

Manter uma única origem confiável para criar um banco Fantasy12 do zero e
continuar evoluindo bancos existentes com o fluxo padrão do Prisma.

## Baseline

A linha de corte oficial é:

```text
20260730000000_fantasy12_baseline_v2
```

Ela contém:

- o schema Prisma completo na data do corte;
- índices e constraints operacionais fora do Prisma;
- nenhuma carga de dados ou seed.

## Histórico legado

As 35 migrations anteriores permanecem recuperáveis no Git e estão
enumeradas em `prisma/migration-baseline-cutover-v2.json`. Elas não ficam
mais na pasta ativa `prisma/migrations`.

No banco existente, o corte:

1. validou todo o histórico esperado;
2. registrou a baseline como aplicada;
3. removeu os registros legados de `_prisma_migrations`;
4. preservou um backup JSON;
5. confirmou que o fingerprint estrutural não mudou.

## Política daqui para frente

- A baseline V2 é imutável.
- Toda mudança de schema gera uma migration incremental nova.
- Backfills permanecem separados de DDL quando aplicável.
- Banco vazio e banco existente usam `prisma migrate deploy`.
- `prisma/baselines/current-fresh-schema.sql` acompanha o schema atual para
  verificação, mas não substitui nem reescreve a migration inicial.

## Comandos oficiais

Banco vazio com seeds:

```sh
npm run prisma:bootstrap:fresh
```

Release incremental:

```sh
npm run prisma:schema:release:check
npm run prisma:migrate:deploy
```

## Critérios de saída

- Um PostgreSQL vazio sobe somente com a cadeia ativa.
- A auditoria reporta zero erros e zero avisos.
- As constraints fora do Prisma existem no banco fresh.
- `prisma migrate status` não mostra divergência.
- O corte da base existente não altera tabelas, índices ou constraints da
  aplicação.
