# Alinhamento Frontend x API

## Fluxos alinhados

- auth por sessão
- `/api/me`
- `/api/rankings/monthly`
- `/api/tickets`
- `/api/wallet`
- `/api/payment-packages`
- `/api/payments`
- `/api/payments/history`
- `/api/subscription`
- `/api/admin/rounds`
- ações admin de rodada

## Fluxos parcialmente alinhados

### `GET /api/rounds/open`

Situação:

- o frontend espera `matches`
- o backend hoje retorna `matches: []` de forma explícita

Leitura:

- o contrato está estabilizado sintaticamente
- a modelagem de partidas ainda não existe de fato no domínio atual

### Bar / pagamento PIX

Situação:

- frontend já usa os pacotes de pagamento reais
- backend cria pagamento e retorna `paymentId` e `status`
- ainda não existe retorno de checkout visual/payload PIX rico nesse fluxo

Leitura:

- o fluxo básico está coerente
- a UX ainda está à frente do backend neste ponto

## Fluxos legados ou fora do contrato atual

- `src/pages/AdminPage.tsx`
- `src/pages/Ranking.tsx`

## Prioridades restantes

1. decidir se páginas legadas serão removidas ou migradas
2. definir se `matches` virarão entidade real no backend
3. evoluir o fluxo de pagamento para retornar dados de checkout/PIX mais úteis
4. consolidar documentação compartilhada em um ponto único no futuro
