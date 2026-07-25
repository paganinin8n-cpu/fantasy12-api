# Runbook de correção e exclusão de dados — MVP V1

Procedimento manual e auditável do SEC-010. Nenhuma exclusão deve começar sem
ticket, identidade confirmada e análise de obrigações financeiras/auditoria.

## Entrada e verificação

1. Registrar `requestId`, canal, data, escopo e responsável no sistema de
   tickets, sem copiar CPF, token ou senha para comentários.
2. Confirmar a identidade pelo fluxo autenticado ou por verificação aprovada
   pelo responsável de Privacidade. Registrar apenas o resultado.
3. Executar `node scripts/privacy-subject-request.js --user-id <uuid>
   --request-id <ticket> --admin-id <uuid> --reason "<motivo>"`. O padrão é
   dry-run e retorna somente contagens.
4. Classificar dados corrigíveis, efêmeros removíveis e registros
   financeiros/auditoria sujeitos a retenção.

## Correção

Corrigir somente os campos confirmados, usando a mesma normalização do cadastro.
Guardar no ticket nomes dos campos alterados, operador e horário, nunca os
valores anteriores/completos. Criar auditoria `PRIVACY_DATA_CORRECTED` com
`requestId`, campos e justificativa.

## Exclusão e restrição

- Para tokens de reset e sessões, obter segunda revisão e executar o script com
  `--execute-ephemeral-cleanup`. Ele apaga tokens, incrementa a versão de sessão,
  revoga sessões Redis e grava `PRIVACY_EPHEMERAL_DATA_CLEANED` na transação.
- Conta, pagamento, carteira, ledger, assinatura e auditoria não são apagados
  automaticamente. Privacidade e Financeiro decidem retenção, anonimização ou
  bloqueio, com justificativa documentada.
- Antes de anonimizar/excluir dados persistentes, registrar contagens, plano de
  rollback e impacto em integridade referencial. Não copiar os valores para a
  evidência.

## Fechamento

Reexecutar o dry-run, anexar contagens antes/depois e o ID da auditoria ao
ticket. Um segundo operador revisa resultado e escopo. Informar ao titular o que
foi corrigido/removido, o que foi retido e o motivo aprovado. Backups seguem a
política de ciclo de vida da infraestrutura; não restaurar dados removidos sem
reaplicar a decisão de privacidade.
