# Bootstrap de banco

## Regra oficial

O Fantasy12 possui uma baseline consolidada e usa a cadeia normal do Prisma
em qualquer ambiente:

```sh
npm run prisma:migrate:deploy
```

Não é mais necessário combinar `prisma db push` com vários comandos
`prisma migrate resolve`.

## Banco vazio

O comando oficial continua sendo:

```sh
npm run prisma:bootstrap:fresh
```

Esse comando:

1. compila a API;
2. confirma que não há tabelas funcionais no schema;
3. executa `prisma migrate deploy`;
4. aplica a baseline consolidada completa;
5. executa os seeds administrativos e da aplicação.

Para preparar o schema sem seeds:

```sh
npm run prisma:bootstrap:fresh:skip-seed
```

O bootstrap bloqueia bancos não vazios por padrão. A opção
`--allow-existing` existe apenas para diagnóstico controlado.

## Banco existente

Use diretamente:

```sh
npm run prisma:migrate:status
npm run prisma:migrate:deploy
```

A base de teste existente teve seu histórico técnico consolidado sem executar
o SQL da baseline sobre as tabelas já criadas. O corte altera somente
`_prisma_migrations` e preserva um backup do histórico anterior.

## Constraints fora do Prisma

A baseline inclui os invariantes versionados em:

- `prisma/constraints/single-open-round.sql`;
- `prisma/constraints/non-negative-balances.sql`;
- `prisma/constraints/canonical-user-identity.sql`;
- `prisma/constraints/bolao-invite-integrity.sql`.

Esses arquivos permanecem como fontes auditáveis. A baseline consolidada já
contém o SQL necessário para um banco novo.

## Novas mudanças

Depois da baseline V2:

1. altere `prisma/schema.prisma`;
2. crie uma nova migration;
3. não edite a baseline já aplicada;
4. regenere `prisma/baselines/current-fresh-schema.sql`;
5. execute os gates de release.

```sh
npm run prisma:baseline:fresh:generate
npm run prisma:schema:release:check
```

## O que não fazer

- Não executar `prisma migrate reset` em uma base com dados importantes.
- Não executar manualmente a baseline V2 sobre a base existente.
- Não editar a baseline depois do corte.
- Não alterar `_prisma_migrations` fora do script controlado.
