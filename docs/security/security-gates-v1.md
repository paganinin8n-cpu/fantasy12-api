# Gates de segurança — MVP V1

Baseline operacional do SEC-011. O comando canônico é `npm run ci:check`; ele
gera `.artifacts/security-gates.json` e falha no primeiro gate reprovado. O
workflow executa o mesmo comando em pull requests e em `main`, publica o
relatório por 30 dias e só permite build da imagem e deploy após aprovação.

| Gate | Proteção | Condição de bloqueio |
| --- | --- | --- |
| `security:audit` | Dependências de produção | Vulnerabilidade alta ou crítica |
| `prisma:schema:release:check` | Cadeia, baseline fresh, constraints e build | Fingerprint legacy alterado, baseline/schema divergente, política ausente ou erro TypeScript |
| `test:competition` | Regras, concorrência e integridade de rodada/Mesa/convite | Qualquer regressão |
| `test:payments` | Mercado Pago, conciliação e assinatura | Qualquer regressão |
| `test:benefits` | Inventário e consumo atômico | Qualquer regressão |
| `test:worker` | Filas e idempotência | Qualquer regressão |
| `test:teams` | Seeds e permissões de times | Qualquer regressão |
| `test:security` | CSRF, sessão, RBAC, identidade, privacidade, headers, rate limit e rotas | Qualquer regressão |

## Matriz de rotas

`config/security-route-policy.json` é a lista canônica das 32 rotas
administrativas e internas do V1. O teste usa a AST TypeScript para comparar
método, caminho, middleware de autenticação e permissão. Uma rota sensível nova
sem regra, ou uma rota existente que perca controle, reprova o CI.

## Dívida controlada de migrations

O histórico possui 44 achados anteriores ao SEC-011. Eles estão congelados em
`prisma/migration-audit-baseline.json` pelo fingerprint
`aa2782b9d65e5b64b378e3280d6fd13721706849911781ee1d553a4e523a374c`.
Qualquer novo achado ou alteração exige revisão e atualização explícita da
baseline. Bancos novos continuam usando o baseline fresh oficial e as
constraints operacionais versionadas.

## QA produtiva reproduzível

- `Production P0 security QA`: finanças, constraints, concorrência e redação de
  webhook.
- `Session security QA`: Redis, cookies, CSRF, login/logout e revogação.
- O deploy aplica migrations, verifica status e aguarda `/health` confirmar API,
  banco e fingerprint exato do release.

SAST/DAST, secret scanning dedicado, execuções ofensivas agendadas, tendências e
SLA de correção permanecem no escopo V2.
