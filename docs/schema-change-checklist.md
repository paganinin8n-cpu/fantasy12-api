# Checklist De Mudança De Schema

Use este checklist sempre que houver alteração em:

- `prisma/schema.prisma`
- `prisma/migrations`
- seeds que dependam do schema novo

## Antes de subir

- [ ] confirmar se a mudança é para banco novo, banco existente ou ambos
- [ ] revisar impacto em seeds
- [ ] revisar impacto em jobs, login, rodada, ticket e admin

## Validação obrigatória local

Rode:

```sh
npm run prisma:schema:release:check
```

Esse comando garante:

- a trilha histórica continua auditada e reportada
- a baseline fresh versionada continua alinhada com o `schema.prisma`
- a politica oficial de bootstrap/migrations continua preservada
- a API continua buildando

Observação:

- a auditoria da cadeia histórica hoje é diagnóstica
- ela ainda aponta problemas legados conhecidos
- por isso o release check usa modo report-only nessa etapa

## Se o schema mudou de verdade

Se a verificação de baseline falhar, rode:

```sh
npm run prisma:baseline:fresh:generate
```

Depois rode novamente:

```sh
npm run prisma:baseline:fresh:verify
```

E versione o arquivo atualizado:

- `/Users/roberson/dev/personal/fantasy12-api/prisma/baselines/current-fresh-schema.sql`

## Ambientes novos

Para banco realmente vazio, o fluxo oficial continua sendo:

```sh
npm run prisma:bootstrap:fresh
```

Esse fluxo aplica o schema atual e registra as migrations historicas como aplicadas. Depois disso, o ambiente novo passa a aceitar migrations futuras via `npm run prisma:migrate:deploy`.

## Ambientes existentes

Para bancos já existentes:

- diagnosticar o estado da trilha
- resolver migrations quebradas, se necessário
- aplicar `prisma migrate deploy`

Comandos usuais:

```sh
npm run prisma:migrate:status
npm run prisma:migrate:diagnose:bolao
npm run prisma:migrate:deploy
```

## Antes de deploy em produção

- [ ] validar `npm run prisma:schema:release:check`
- [ ] definir se haverá bootstrap fresh ou deploy incremental
- [ ] confirmar segredo/ambiente corretos
- [ ] confirmar plano de rollback lógico
- [ ] confirmar que a documentação operacional continua batendo com a prática

## Referências

- `/Users/roberson/dev/personal/fantasy12-api/docs/database-bootstrap.md`
- `/Users/roberson/dev/personal/fantasy12-api/docs/migration-chain-audit.md`
- `/Users/roberson/dev/personal/fantasy12-api/docs/migration-baseline-plan.md`
