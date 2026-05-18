# Plano Para Baseline Definitiva

## Objetivo

Sair do estado atual:

- banco vazio -> `db push + seeds`
- banco existente -> `migrate deploy`

para um estado mais simples no futuro:

- baseline Prisma definitiva para ambientes fresh
- migrations futuras realmente reexecutáveis em sequência

## Situação Atual

Hoje já temos:

- bootstrap seguro para banco vazio
- baseline canônica em `prisma/baselines/current-fresh-schema.sql`
- auditoria da cadeia histórica em `docs/migration-chain-audit.md`

Isso já resolve operação, mas ainda não resolve elegância histórica da trilha.

## Estratégia Recomendada

### Etapa 1. Congelar a cadeia histórica como legado

Não tentar “consertar” a história antiga migration por migration.

Motivos:

- risco alto de quebrar bancos já existentes
- migrations antigas assumem produção legada
- há arquivos com encoding inconsistente

### Etapa 2. Escolher um ponto de corte

Criar uma baseline definitiva a partir do schema atual, por exemplo:

- `202605xx_fresh_baseline_v2`

Essa baseline deve representar o estado completo do schema atual em banco vazio.

### Etapa 3. Definir política operacional

Depois da baseline definitiva:

- ambientes realmente novos usam essa baseline
- bancos antigos continuam seguindo a trilha existente até convergir

Na prática, isso pode significar um período de transição em que:

- produção antiga continua intacta
- novos ambientes passam a nascer já na baseline nova

### Etapa 4. Normalizar encoding e qualidade dos arquivos

Antes de institucionalizar a nova trilha:

- converter migrations UTF-16LE legadas para UTF-8 apenas se houver real necessidade de manutenção
- padronizar comentários e estilo dos SQLs futuros
- garantir que toda migration nova rode em banco montado a partir da baseline nova

### Etapa 5. Validar em ambiente efêmero

Rodar a baseline nova em banco realmente vazio e validar:

- schema final
- seeds mínimas
- login
- rodada
- ticket
- admin
- assinatura

## Critério de Saída

A baseline definitiva só deve substituir o modelo atual quando estes três pontos forem verdadeiros:

1. um banco vazio sobe do zero sem `db push`;
2. o schema final bate com o `schema.prisma`;
3. a produção atual não precisa de intervenção destrutiva para continuar evoluindo.

## Decisão Prática De Curto Prazo

Até essa baseline definitiva existir, o projeto deve continuar tratando como oficial:

```sh
npm run prisma:bootstrap:fresh
```

Isso mantém o sistema previsível agora, sem introduzir risco desnecessário.
