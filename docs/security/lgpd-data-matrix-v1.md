# Matriz mínima de dados pessoais — MVP V1

Baseline operacional do SEC-010. A base legal e os prazos definitivos devem ser
validados pelo responsável jurídico antes de qualquer mudança de finalidade ou
prazo. “Execução do contrato” e “segurança/legítimo interesse” abaixo descrevem
a finalidade operacional atual, não substituem essa validação.

| Categoria | Finalidade e justificativa de uso | Armazenamento | Acesso | Retenção V1 | Responsável |
| --- | --- | --- | --- | --- | --- |
| Nome, apelido e e-mail | Criar conta, autenticar, comunicar e prestar o serviço; execução do contrato | `users` | Usuário; suporte via `USER_READ` com e-mail mascarado; valor completo via `USER_PII_READ` | Enquanto a conta estiver ativa; revisar na solicitação de exclusão | Produto / Operações |
| CPF | Unicidade, prevenção a fraude e processos financeiros aplicáveis; execução do contrato e obrigações aplicáveis | `users` | Usuário e acesso individual auditado por `USER_PII_READ` | Enquanto necessário ao vínculo e às obrigações aplicáveis | Financeiro / Privacidade |
| Telefone | Contato e recuperação operacional quando informado; execução do serviço | `users` | Usuário e acesso individual auditado por `USER_PII_READ` | Enquanto a conta estiver ativa ou até correção/exclusão válida | Operações |
| Hash de senha | Autenticação; execução do serviço e segurança | `users` (bcrypt) | Aplicação; não há leitura administrativa | Até troca ou exclusão válida da conta | Engenharia |
| Hash de token de reset | Recuperação de conta; segurança | `ranking_rounds` (modelo legado `PasswordResetToken`) | Aplicação; sem leitura administrativa | Até uso/expiração; limpeza manual prevista no runbook | Engenharia |
| Sessão, cookie, IP e user-agent | Manter sessão, revogar acesso e investigar abuso; segurança/legítimo interesse sujeito a balanceamento | Redis e logs de auditoria | Aplicação; auditoria via `AUDIT_READ`, com metadados sensíveis redigidos | TTL da sessão; auditoria conforme política operacional aprovada | Segurança / Engenharia |
| Pagamento, carteira e pedido | Cobrança, conciliação, suporte e prestação de contas; execução do contrato e obrigações aplicáveis | PostgreSQL | Serviços financeiros e `FINANCE_READ`/`FINANCE_EXECUTE` | Pelo prazo financeiro/legal validado; não excluir automaticamente | Financeiro |
| Payload Mercado Pago minimizado | Idempotência, conciliação e auditoria técnica | `payment_webhook_events` | Serviços de pagamento e leitura financeira autorizada | Enquanto necessário à conciliação/auditoria; revisar em V2 | Financeiro / Engenharia |
| IDs externos de assinatura | Vincular e cancelar assinatura no provedor | `subscriptions` | Serviços de pagamento e leitura financeira autorizada | Durante vínculo e prazo de conciliação aplicável | Financeiro |
| Backups | Continuidade e recuperação de desastre | Infraestrutura gerenciada | Operadores de infraestrutura autorizados | Conforme política de backup vigente; expurgo/anônimização automatizados ficam para V2 | Infraestrutura |

Controles V1:

- TLS protege o trânsito nos endpoints públicos; controles de armazenamento e
  backup dependem da plataforma e não são declarados como criptografados sem
  evidência operacional.
- Logs normais redigem credenciais, cookies, assinaturas, CPF e telefone e
  mascaram e-mail.
- O payload do Mercado Pago usa uma allowlist de campos escalares e a migration
  do SEC-010 reduz também os eventos já armazenados.
- `ADMIN` não recebe `USER_PII_READ` por padrão. `SUPERADMIN` mantém o bypass
  RBAC explícito; concessões adicionais devem ter justificativa e revisão.
- Automação de retenção/expurgo, portal do titular, criptografia seletiva,
  relatório periódico de acessos e governança de backups pertencem à V2.
