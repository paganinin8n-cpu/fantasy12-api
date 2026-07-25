# Política de acesso por convite de Mesa — MVP V1

As Mesas usam acesso híbrido no MVP V1:

- a entrada direta em uma Mesa disponível continua permitida;
- o convite é um atalho compartilhável, não uma credencial obrigatória;
- somente o proprietário PRO da Mesa pode criar convites;
- `maxUses`, expiração, estado ativo e janela de inscrição são limites
  independentes e obrigatórios;
- repetir o mesmo convite depois de já estar aprovado é idempotente e não
  consome uso adicional.

## Invariante transacional

A reserva do convite usa um `UPDATE` condicional que incrementa `usedCount`
somente quando o convite ainda está ativo, não expirou e está abaixo de
`maxUses`. Reserva, débito da entrada, criação/aprovação do participante,
atualização financeira da Mesa e auditoria executam na mesma transação.

Se qualquer etapa da entrada falhar, inclusive saldo insuficiente ou conflito
de participante, o PostgreSQL reverte também a reserva. Constraints impedem
contadores negativos, limite não positivo e `usedCount > maxUses`.

O código do convite não é persistido nos metadados de auditoria.
