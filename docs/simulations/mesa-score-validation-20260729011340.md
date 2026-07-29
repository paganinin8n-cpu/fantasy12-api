# Validação de score de Mesa — 20260729011340

- **Status:** ok
- **Seed:** `729011340`
- **Gerado em:** 2026-07-29T01:13:40.621Z
- **Fórmula:** `scoreMesa = scoreTotalCurrent(até endDate) - scoreInitial(antes de startDate)`

## Veredito

**PASSOU** — Score de mesa consistente: esperado = engine = stored = ranking view

## Usuários

- **alpha**: [SCORETEST 20260729011340] Alpha PRO (`scoretest-20260729011340-alpha@simulation.fantasy12.test`) — c677bfd3-1372-4818-80ab-76fb0b17b9b3
- **beta**: [SCORETEST 20260729011340] Beta PRO (`scoretest-20260729011340-beta@simulation.fantasy12.test`) — 11eca094-813e-4551-8a69-26472270b9d5

## Timeline

- **usersCreated**: 01/07/2026, 07:00:00 (UTC 2026-07-01T10:00:00.000Z)
- **r1Close**: 02/07/2026, 09:00:00 (UTC 2026-07-02T12:00:00.000Z)
- **mesaAStart**: 02/07/2026, 21:00:00 (UTC 2026-07-03T00:00:00.000Z)
- **r2Close**: 04/07/2026, 09:00:00 (UTC 2026-07-04T12:00:00.000Z)
- **mesaBStart**: 04/07/2026, 21:00:00 (UTC 2026-07-05T00:00:00.000Z)
- **r3Close**: 06/07/2026, 09:00:00 (UTC 2026-07-06T12:00:00.000Z)
- **mesaAEnd**: 06/07/2026, 21:00:00 (UTC 2026-07-07T00:00:00.000Z)
- **r4Close**: 08/07/2026, 09:00:00 (UTC 2026-07-08T12:00:00.000Z)
- **mesaBEnd**: 08/07/2026, 21:00:00 (UTC 2026-07-09T00:00:00.000Z)

## Rodadas

### R1_OUTSIDE (#4) — close 02/07/2026, 09:00:00
- alpha: scoreRound=0 (hits=4, misses=8, 2x hit/miss=0/0, 4x hit/miss=0/1)
- beta: scoreRound=-6 (hits=4, misses=8, 2x hit/miss=0/1, 4x hit/miss=0/2)

### R2_IN_A (#5) — close 04/07/2026, 09:00:00
- alpha: scoreRound=-1 (hits=2, misses=10, 2x hit/miss=0/1, 4x hit/miss=1/1)
- beta: scoreRound=7 (hits=6, misses=6, 2x hit/miss=1/0, 4x hit/miss=0/0)

### R3_IN_A_AND_B (#6) — close 06/07/2026, 09:00:00
- alpha: scoreRound=-8 (hits=2, misses=10, 2x hit/miss=0/1, 4x hit/miss=0/2)
- beta: scoreRound=5 (hits=5, misses=7, 2x hit/miss=2/1, 4x hit/miss=0/0)

### R4_IN_B_ONLY (#7) — close 08/07/2026, 09:00:00
- alpha: scoreRound=-1 (hits=1, misses=11, 2x hit/miss=0/1, 4x hit/miss=0/0)
- beta: scoreRound=11 (hits=7, misses=5, 2x hit/miss=1/0, 4x hit/miss=1/0)

## Mesas

### mesaA — [SCORETEST 20260729011340] Mesa A (R2+R3)
- id: `7d35d8be-9e6f-4cba-9943-a43f9e4ec886`
- janela: 02/07/2026, 21:00:00 → 06/07/2026, 21:00:00
- cobre: R2, R3
- alpha scoreInitial=0
- beta scoreInitial=-6

### mesaB — [SCORETEST 20260729011340] Mesa B (R3+R4)
- id: `2d89b47b-f6f6-4582-837d-f184c9eb0f69`
- janela: 04/07/2026, 21:00:00 → 08/07/2026, 21:00:00
- cobre: R3, R4
- alpha scoreInitial=-1
- beta scoreInitial=1

## Validações

| Mesa | User | Initial | Current | Expected | Engine | Stored | View | Pass |
|---|---|---:|---:|---:|---:|---:|---:|:---:|
| mesaA | alpha | 0 | -9 | -9 | -9 | -9 | -9 | OK |
| mesaA | beta | -6 | 6 | 12 | 12 | 12 | 12 | OK |
| mesaB | alpha | -1 | -10 | -9 | -9 | -9 | -9 | OK |
| mesaB | beta | 1 | 17 | 16 | 16 | 16 | 16 | OK |
