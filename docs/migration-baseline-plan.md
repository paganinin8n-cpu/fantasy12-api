# Plano Para Baseline Definitiva

## Objetivo

Definir a decisao operacional para a linha de corte das migrations do Fantasy12.

O estado antigo era:

- banco vazio -> `db push + seeds`
- banco existente -> `migrate deploy`

O estado atual fica:

- banco vazio -> `db push + registro da trilha historica como aplicada + seeds`
- banco existente -> `migrate deploy`
- migrations futuras -> criadas normalmente e aplicadas por `migrate deploy`

## Situação Atual

Hoje temos:

- bootstrap seguro para banco vazio
- baseline canônica em `prisma/baselines/current-fresh-schema.sql`
- verificação automatizada da baseline com `npm run prisma:baseline:fresh:verify`
- auditoria da cadeia histórica em `docs/migration-chain-audit.md`
- checagem automatizada da politica com `npm run prisma:migration:policy:check`

Isso resolve a operacao sem tentar reescrever migrations que ja foram usadas por producao.

## Estratégia Definida

### 1. Congelar a cadeia histórica como legado

Não tentar “consertar” a história antiga migration por migration.

Motivos:

- risco alto de quebrar bancos já existentes
- migrations antigas assumem produção legada
- há arquivos com encoding inconsistente

### 2. Usar o schema atual como ponto de corte operacional

O ponto de corte nao sera uma migration Prisma nova inserida no meio da cadeia antiga. O ponto de corte sera:

- `prisma/schema.prisma`
- `prisma/baselines/current-fresh-schema.sql`
- `scripts/bootstrap-database.js`

O bootstrap cria o schema final com `prisma db push` e depois registra todas as migrations historicas como aplicadas com `prisma migrate resolve --applied`.

### 3. Definir política operacional

Depois do bootstrap:

- ambientes novos podem receber migrations futuras via `prisma migrate deploy`
- bancos antigos continuam seguindo `migrate deploy`
- a cadeia antiga permanece auditada e documentada, mas nao e usada para montar banco vazio

### 4. Normalizar qualidade daqui para frente

Para migrations novas:

- criar migration incremental normal
- manter SQL em UTF-8
- separar DDL de backfills
- validar com `npm run prisma:schema:release:check`
- aplicar em banco existente com `npm run prisma:migrate:deploy`

### 5. Validar em ambiente efêmero

Rodar o bootstrap em banco realmente vazio e validar:

- schema final
- seeds mínimas
- login
- rodada
- ticket
- admin
- assinatura

## Critério de Saída

Os itens de backlog 3 e 4 ficam concluidos quando estes pontos forem verdadeiros:

1. um banco vazio sobe do zero pelo comando oficial;
2. o schema final bate com o `schema.prisma`;
3. migrations historicas nao rodam em banco fresh;
4. o banco fresh fica apto a receber migrations futuras por `migrate deploy`;
5. a producao atual nao precisa de intervencao destrutiva para continuar evoluindo.

## Decisão Final

O comando oficial para banco vazio e:

```sh
npm run prisma:bootstrap:fresh
```

O comando oficial de release de schema e:

```sh
npm run prisma:schema:release:check
```

Esse desenho fecha a ambiguidade entre `db push`, migrations e seeds sem introduzir risco desnecessario em producao.
