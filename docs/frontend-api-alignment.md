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
- `/api/subscription/plans`
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

### Assinatura PRO / checkout

Situação:

- frontend consome `GET /api/subscription` como status composto com `isPro`, `isAnnualPro` e `subscription`
- frontend consome `GET /api/subscription/plans` para exibir PRO mensal, PRO anual no cartao e PRO anual no PIX
- frontend chama `POST /api/subscription/checkout` e redireciona para o `checkoutUrl` do Mercado Pago
- assinatura e ativada pelo webhook de pagamento aprovado com `metadata.plan`

Leitura:

- precificacao, contrato visual e abertura de checkout estao alinhados
- falta validar em producao um pagamento real de assinatura e acompanhar o webhook de confirmacao

## Fluxos legados ou fora do contrato atual

- `src/pages/AdminPage.tsx`
- `src/pages/Ranking.tsx`

## Prioridades restantes

1. decidir se páginas legadas serão removidas ou migradas
2. definir se `matches` virarão entidade real no backend
3. validar pagamento real de assinatura em producao e webhook de confirmacao
4. evoluir o fluxo de pagamento de fichas para retornar dados de checkout/PIX mais úteis
5. consolidar documentação compartilhada em um ponto único no futuro
