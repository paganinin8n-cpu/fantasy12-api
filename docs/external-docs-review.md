# Revisão dos Documentos Externos

## Arquivos analisados

- `/Users/roberson/Downloads/FANTASY12_MASTER.md`
- `/Users/roberson/Downloads/README.md`
- `/Users/roberson/Downloads/ROUTES.md`
- `/Users/roberson/Downloads/JOBS.md`
- `/Users/roberson/Downloads/DATABASE.md`
- `/Users/roberson/Downloads/ARCHITECTURE.md`
- `/Users/roberson/Downloads/RULES_ENGINE.md`
- `/Users/roberson/Downloads/schema.prisma`

## Conclusão geral

Os documentos externos são úteis, mas têm naturezas diferentes:

- domínio, banco e princípios arquiteturais: majoritariamente coerentes com o projeto atual
- rotas e jobs: parcialmente desatualizados em relação ao código real

## O que pode ser tratado como referência forte

### Banco e modelagem

O `schema.prisma` recebido é idêntico ao `prisma/schema.prisma` atual do repositório.

Implicação:

- o material de banco pode ser tratado como confiável
- `DATABASE.md` está alinhado com a modelagem atual

### Princípios do sistema

Arquivos com boa aderência conceitual:

- `FANTASY12_MASTER.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `RULES_ENGINE.md`

Pontos que batem com o código:

- backend como fonte da verdade
- frontend sem lógica crítica
- Prisma como fonte de verdade do banco
- ledger financeiro imutável
- jobs para lógica crítica
- engines separadas por domínio

## O que está desatualizado

### `ROUTES.md`

Principais divergências:

- documenta `GET /api/tickets`, mas hoje foi confirmado apenas `POST /api/tickets`
- usa `/api/ranking/:id` e `/api/ranking/global`, enquanto o backend atual usa `/api/rankings/*`
- documenta `POST /api/subscription`, enquanto o backend atual expõe `GET /api/subscription`
- documenta admin sem o prefixo atual `/api/admin/*`
- documenta menos rotas do que o backend real hoje possui

### `JOBS.md`

Principais divergências:

- documenta `/internal/jobs/process-round`, mas o backend atual expõe `/internal/jobs/score-round`
- documenta `/internal/jobs/generate-ranking`, mas o backend atual possui `/internal/jobs/close-expired-rankings` e jobs de subscriptions
- documenta `/internal/webhooks/payment`, mas o código atual usa `/internal/webhooks/mercado-pago`

## Classificação recomendada

### Canônico de negócio

- `FANTASY12_MASTER.md`
- `ARCHITECTURE.md`
- `DATABASE.md`
- `RULES_ENGINE.md`
- `schema.prisma`

### Requer revisão antes de confiar

- `ROUTES.md`
- `JOBS.md`
- partes do `README.md`

## Recomendação prática

O time não deve usar `ROUTES.md` e `JOBS.md` externos como fonte final de verdade.

Em vez disso:

- usar os docs consolidados em `docs/` deste repositório
- manter rotas e jobs atualizados a partir do código real
- tratar os arquivos externos como material histórico ou de visão do produto
