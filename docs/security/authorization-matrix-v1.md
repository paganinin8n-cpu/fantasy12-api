# Matriz de autorização — MVP V1

Esta é a matriz canônica do SEC-007. As rotas usam `authorize`, que consulta
exclusivamente `UserAdminRole`, `AdminRole` e `AdminRolePermission`.
`User.role = ADMIN` não concede acesso administrativo.

| Operação | Permissão |
| --- | --- |
| Consultar usuários | `USER_READ` |
| Alterar papéis administrativos | `USER_WRITE` |
| Bloquear usuário | `USER_BLOCK` |
| Desbloquear usuário | `USER_UNBLOCK` |
| Alterar assinatura de usuário | `USER_PLAN_WRITE` |
| Consultar auditoria e histórico | `AUDIT_READ` |
| Consultar carteira, ledger, benefícios e assinaturas | `FINANCE_READ` |
| Creditar ou debitar carteira e benefícios | `FINANCE_EXECUTE` |
| Consultar rodadas e times | `COMPETITION_READ` |
| Criar ou editar rodadas e times | `COMPETITION_WRITE` |
| Abrir, cancelar, fechar ou lançar resultado de rodada | `COMPETITION_EXECUTE` |
| Fechar/liquidar Mesa de outro proprietário | `COMPETITION_EXECUTE` |
| Executar job interno autorizado | `JOB_EXECUTE` |

O proprietário pode fechar a própria Mesa por autorização de domínio. Um
operador que não seja proprietário precisa de `COMPETITION_EXECUTE`. O
`SUPERADMIN` possui bypass explícito dentro do mesmo mecanismo RBAC e as
concessões/negações sensíveis continuam auditadas.
