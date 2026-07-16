# Integridade de Mesas legadas

## Objetivo

Impedir que uma Mesa antiga seja encerrada ou liquidada com configuração financeira inconsistente, sem gerar débitos retroativos aos participantes.

## Diagnóstico seguro

Execute:

```bash
npm run mesa:integrity:diagnose
```

O comando é somente leitura, retorna um resumo e lista cada Mesa afetada. Código de saída `2` significa que foram encontradas inconsistências; código `1` significa falha operacional do diagnóstico.

Problemas reportados:

- `MISSING_PRIZE_RULES`: regras/observações ausentes;
- `INVALID_PRIZE_DISTRIBUTION`: distribuição inválida ou diferente de 100%;
- `APPROVED_ENTRY_NOT_PAID`: aprovado sem data e valor integral de pagamento;
- `GROSS_COLLECTED_MISMATCH`: arrecadação diverge das entradas comprovadas;
- `PRIZE_TOTALS_MISMATCH`: taxa ou prêmio líquido diverge da política oficial.

## Bloqueio automático

O fechamento executa o mesmo preflight dentro da transação. Se houver qualquer problema, pontuação, carteiras, liquidação e status permanecem inalterados. Uma auditoria `BOLAO_SETTLEMENT_BLOCKED_INTEGRITY` registra os motivos fora da transação revertida.

## Remediação operacional

1. Salve o relatório antes de qualquer ajuste.
2. Corrija somente dados que possuam evidência auditável: regras originalmente publicadas, distribuição comunicada e lançamentos de entrada existentes.
3. Nunca debite retroativamente um participante aprovado sem pagamento comprovado. Remova/rejeite a participação ou trate o valor como perda operacional conforme decisão de negócio documentada.
4. Recalcule `grossCollected` somente a partir de entradas com `entryPaidAt` e `entryFeePaid` integral.
5. Recalcule taxa e prêmio pela política `platformFee = floor(grossCollected * 10%)` e `prizePool = grossCollected - platformFee`.
6. Registre cada correção no `AuditLog` com operador, evidência, valores anteriores e novos.
7. Execute novamente o diagnóstico. Só repita o fechamento quando a Mesa não apresentar problemas.

O fechamento e os créditos aos vencedores já possuem chaves idempotentes. Reexecutar depois de uma correção válida não duplica liquidação.
