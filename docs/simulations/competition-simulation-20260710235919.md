# Simulacao de competicao 20260710235919

Resultado: `ok`. Execucao real em 10/07/2026, das 20:59:19.024 as 20:59:19.546 (America/Sao_Paulo).

## Agenda efetiva

| Evento | Data/hora Sao Paulo | Gravado em Sao Paulo |
| --- | --- | --- |
| Usuarios criados | 01/07/2026 09:00:00 | 10/07/2026 20:59:19.243 |
| Rodada 1 encerrada | 02/07/2026 09:00:00 | 10/07/2026 20:59:19.319 |
| Mesa iniciada; creator e early admitidos | 03/07/2026 09:00:00 | 10/07/2026 20:59:19.365 |
| Rodada 2 encerrada | 04/07/2026 09:00:00 | 10/07/2026 20:59:19.429 |
| Late admitido | 05/07/2026 09:00:00 | 10/07/2026 20:59:19.474 |
| Rodada 3 encerrada | 06/07/2026 09:00:00 | 10/07/2026 20:59:19.545 |
| Termino programado da Mesa | 10/07/2026 09:00:00 | - |

As datas efetivas foram persistidas em UTC (12:00:00Z). O relatorio tambem preserva o instante real em que cada fotografia foi coletada.

## Evolucao global

| Momento | Creator PRO | Early PRO | Late PRO | Free | Ranking geral |
| --- | ---: | ---: | ---: | ---: | --- |
| Inicio | 0 | 0 | 0 | 0 | sem rodada |
| Rodada 1, antes da Mesa | 12 | 0 | 5 | 6 | creator, free, late, early |
| Mesa criada | 12 | 0 | 5 | 6 | sem alteracao |
| Rodada 2 | 12 | 0 | 17 | 12 | late, free, creator, early |
| Late entra na Mesa | 12 | 0 | 17 | 12 | sem alteracao |
| Rodada 3 | -4 | 12 | 29 | 18 | late, free, early, creator |

Calculo final global:

- Creator: `12 + 0 - 16 = -4`.
- Early: `0 + 0 + 12 = 12`.
- Late: `5 + 12 + 12 = 29`.
- Free: `6 + 6 + 6 = 18`.

O ranking mensal geral reproduziu esses acumulados. O ranking mensal PRO excluiu corretamente o usuario Free e terminou em late (29), early (12), creator (-4).

## Evolucao da Mesa

| Momento | Creator | Early | Late |
| --- | --- | --- | --- |
| Criacao em 03/07 | 0, baseline 12, pos. 1 | 0, baseline 0, pos. 1 | fora |
| Depois da rodada 2 | 0, pos. 1 | 0, pos. 1 | fora |
| Admissao de late em 05/07 | 0, baseline 12 | 0, baseline 0 | 0, baseline 17 |
| Depois da rodada 3 | 0, rodada -16, pos. 3 | 12, rodada 12, pos. 1 | 12, rodada 12, pos. 1 |

A Mesa usa `max(startDate, approvedAt)` como inicio individual:

- Os 12 pontos de creator na rodada 1 nao entraram porque ela fechou antes do inicio da Mesa.
- Os 5 pontos da rodada 1 e os 12 da rodada 2 de late ficaram no Global. Late entrou somente em 05/07 com baseline 17, portanto apenas a rodada 3 contou na Mesa.
- Early e late fizeram 12 pontos validos na janela e empataram. As posicoes ficaram `1, 1, 3`, sem criar uma segunda posicao artificial.
- Creator fez -16 na janela. O Global aceita o total negativo, mas a exibicao acumulada da Mesa aplica piso zero; `scoreRound` preserva -16.

## Conclusao

A cronologia, os acumulados Global/mensal, a segmentacao PRO e as admissoes da Mesa foram respeitados. A regra que merece confirmacao de produto e o piso zero exclusivo da Mesa: tecnicamente esta consistente com a implementacao atual, mas faz a Mesa mostrar 0 enquanto o mesmo usuario aparece com -4 no Global.

Evidencia completa: `competition-simulation-20260710235919.json`.
