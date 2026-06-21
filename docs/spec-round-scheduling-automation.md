# Especificação: automação de abertura e fechamento de rodada (palpites)

> **Origem:** feedback do admin (áudio + print da tela **Nova Rodada**).  
> **Projetos afetados:** `fantasy12-api`, `fantasy12-frontend`, `fantasy12-infra`.

---

## 1. Contexto do problema

O admin criou uma rodada, avisou os usuários que podiam palpitar, mas **esqueceu de clicar em "Abrir rodada"**. A rodada ficou em `DRAFT` e os palpites não apareceram para ninguém.

No print da tela admin, os campos destacados são:

- **Abertura:** `20/06/2026, 19:26`
- **Fechamento:** `27/06/2026, 19:26`

A dúvida do admin: *"Esses campos só gravam ou já têm função?"*

**Resposta atual no código:** hoje **só gravam** `openAt` e `closeAt` no banco. A abertura exige ação manual do admin. O `closeAt` é exibido no dashboard, mas **não bloqueia palpites** automaticamente.

---

## 2. Objetivo

Implementar **automação da janela de palpites** usando `openAt` e `closeAt`, mantendo **apuração manual**.

| Ação | Automático? | Comportamento |
|------|-------------|---------------|
| Abrir rodada para palpites (`DRAFT → OPEN`) | **Sim** | No horário de `openAt` |
| Fechar rodada para palpites (`OPEN → CLOSED`) | **Sim** | No horário de `closeAt` |
| Informar resultado + apurar (`CLOSED → SCORED`) | **Não** | Continua manual ("Fechar e apurar") |

---

## 3. Regras de negócio (produto)

### 3.1 Abertura automática

- Quando `now >= openAt`, a rodada em `DRAFT` deve abrir automaticamente (`OPEN`).
- Pré-requisitos (já existem em `OpenRoundService`):
  - exatamente **12 jogos** cadastrados;
  - **nenhuma outra rodada** em `OPEN`.
- Conceder benefícios FREE ao abrir (já existe em `GrantRoundBenefitsService`).
- Idempotente: se já estiver `OPEN`, não faz nada.

**Exemplo do admin:** rodada na quarta. Abrir na **segunda 00:00** para palpitar segunda, terça e quarta.

### 3.2 Fechamento automático para palpites

- Quando `now >= closeAt`, rodada `OPEN` passa para `CLOSED`.
- Após isso, **ninguém envia palpite**.
- **Não apura** automaticamente — só trava palpites.
- Admin informa resultado depois e clica em **"Fechar e apurar"** (fluxo atual).

**Exemplo do admin:** primeiro jogo quarta **17:00** → fechar palpites **16:45** (15 min antes).

### 3.3 Cálculo sugerido de `closeAt` (UX, opcional mas desejável)

Se os jogos têm `matchTime`:

```
closeAt = min(matchTime dos 12 jogos) - 15 minutos
```

- Se admin alterar horário do Jogo 1, recalcular sugestão de `closeAt` (com opção de override manual).
- Validar: `openAt < closeAt`.

### 3.4 O que permanece manual

- **"Fechar e apurar"** (`POST /api/admin/rounds/:id/close` via `RoundAdminService.closeRound`):
  - exige resultado preenchido;
  - apura, gera ranking, marca `SCORED`.
- **"Abrir rodada"** no admin pode permanecer como **override manual** (abrir antes do horário agendado).
- **"Inativar rodada"** permanece como está.

---

## 4. Estado atual no código (gap analysis)

### Frontend — `fantasy12-frontend`

| Arquivo | Situação |
|---------|----------|
| `src/pages/AdminRound.tsx` | Formulário "Programar abertura e fechamento" envia `openAt`/`closeAt` no create/update |
| `src/pages/Dashboard.tsx` | Mostra `closeAt` como "Fecha em…" |
| `src/modules/admin/admin-round.service.ts` | `create`, `update`, `open`, `close` |

**Gap:** UI não deixa claro que datas são agendamento automático. Mensagem pós-criação: *"Rodada criada"* — não avisa que palpites só liberam após abertura (manual hoje).

### Backend — `fantasy12-api`

| Componente | Situação |
|------------|----------|
| `create-round.service.ts` | Persiste `openAt`, `closeAt`; cria em `DRAFT` |
| `open-round.service.ts` | Abre rodada, mas **sobrescreve** `openAt` com `new Date()` |
| `create-ticket.service.ts` | Valida só `status === 'OPEN'`; **ignora** `closeAt` |
| `close-round.service.ts` | `OPEN → CLOSED` (simples, sem apuração) |
| `round-admin.service.ts` | `closeRound` = fechar + apurar (precisa resultado) |
| `POST /internal/jobs/open-round` | Existe, mas exige `roundId` no body — **sem scheduler** |
| `RoundMatch.matchTime` | Existe no schema e no form admin |

**Gaps principais:**

1. `openAt`/`closeAt` são metadados, não disparam jobs.
2. Abertura manual esquecida = rodada invisível para palpites.
3. `OpenRoundService` perde horário agendado ao abrir.
4. Palpites não respeitam `closeAt` até mudar status.
5. Não há job/cron de fechamento por horário.

---

## 5. Proposta técnica de implementação

### 5.1 Backend — novos jobs internos

#### Job A: `POST /internal/jobs/open-scheduled-rounds`

**Responsabilidade:** abrir rodadas agendadas.

**Lógica:**

```sql
SELECT * FROM rounds
WHERE status = 'DRAFT'
  AND openAt IS NOT NULL
  AND openAt <= NOW()
ORDER BY openAt ASC
LIMIT 1  -- respeitar regra de uma rodada OPEN por vez
```

Para cada candidata:

- chamar `OpenRoundService.execute(roundId)` via `InternalJobRunnerService` (`jobName: 'OPEN_ROUND'`);
- pular se outra rodada já estiver `OPEN`.

#### Job B: `POST /internal/jobs/close-scheduled-rounds`

**Responsabilidade:** fechar palpites de rodadas vencidas.

**Lógica:**

```sql
SELECT * FROM rounds
WHERE status = 'OPEN'
  AND closeAt IS NOT NULL
  AND closeAt <= NOW()
```

Para cada uma:

- chamar `CloseRoundService.execute(roundId)` (não `RoundAdminService.closeRound`);
- `jobName` sugerido: `CLOSE_ROUND_PREDICTIONS`.

**Importante:** `CloseRoundService` hoje não atualiza `closeAt` — considerar registrar `closedAt` real ou manter `closeAt` como horário agendado.

### 5.2 Backend — ajustes em serviços existentes

#### `OpenRoundService`

- **Não sobrescrever** `openAt` agendado; ou separar:
  - `scheduledOpenAt` (planejado)
  - `openedAt` (efetivo)
- Se não quiser migration agora: preservar `openAt` original e adicionar `openedAt` opcional.

#### `CreateTicketService`

Adicionar validação defensiva (mesmo com job de fechamento):

```ts
if (round.closeAt && new Date() >= round.closeAt) {
  throw AppError.badRequest('O prazo para palpites encerrou.', 'round_predictions_closed')
}
if (round.openAt && new Date() < round.openAt) {
  throw AppError.badRequest('A rodada ainda não abriu para palpites.', 'round_not_open_yet')
}
```

#### `GetOpenRoundService`

- Retornar rodada `OPEN` cujo `closeAt` ainda não passou;
- ou retornar `OPEN` com flag `predictionsOpen: boolean`.

### 5.3 Infra — scheduler/cron

Agendar no ambiente de produção (Cloud Scheduler, cron, etc.):

| Job | Frequência sugerida |
|-----|---------------------|
| `open-scheduled-rounds` | a cada **1 minuto** |
| `close-scheduled-rounds` | a cada **1 minuto** |

Autenticação: header `x-internal-job-token` (já existe em `internal-job-auth.middleware.ts`).

Registrar execuções em `InternalJobRunnerService` e expor em `GET /api/admin/operational/status` (já lista `OPEN_ROUND`).

### 5.4 Frontend — ajustes de UX (`AdminRound`)

**Tela:** seção **Nova Rodada → Programar abertura e fechamento**

1. **Copy dos campos:**
   - `Abertura` → *"Abertura automática para palpites"*
   - `Fechamento` → *"Fechamento automático para palpites"*

2. **Texto de ajuda:**
   > "A rodada abrirá e fechará automaticamente nos horários abaixo. A apuração continua manual."

3. **Após criar rodada (`DRAFT`):**
   > "Rodada criada. Palpites liberados automaticamente em {openAt}. Fechamento em {closeAt}."

4. **Card de rodada em `DRAFT`:**
   - Badge: *"Aguardando abertura automática"*
   - Mostrar countdown ou data/hora de `openAt`
   - Manter botão **"Abrir agora"** como override

5. **Opcional:** botão *"Calcular fechamento (15 min antes do 1º jogo)"* usando `matchTime` do jogo mais cedo.

### 5.5 Frontend — app do usuário

- Dashboard/Ticket: se rodada `DRAFT` ou `closeAt` passou, mensagem clara:
  - *"Palpites abrem em…"*
  - *"Prazo encerrado"*
- Não depender só de `status === 'OPEN'` no client.

---

## 6. Fluxo completo esperado (happy path)

```
1. Admin cria rodada (DRAFT)
   - openAt = seg 20/06 00:00
   - closeAt = qua 25/06 16:45
   - 12 jogos preenchidos (Jogo 1 matchTime = qua 25/06 17:00)

2. Seg 00:00 → job abre → OPEN
   - usuários podem palpitar

3. Qua 16:45 → job fecha palpites → CLOSED
   - novos palpites bloqueados

4. Admin preenche resultado manualmente

5. Admin clica "Fechar e apurar" → SCORED
```

---

## 7. Casos de borda e validações

| Caso | Comportamento esperado |
|------|------------------------|
| Rodada `DRAFT` sem 12 jogos na hora de `openAt` | Job falha; registrar erro; admin corrige e próxima execução abre |
| Já existe rodada `OPEN` | Nova não abre; log WARN; admin deve concluir a ativa |
| Admin abre manualmente antes de `openAt` | Permitido (override) |
| `closeAt` antes de `openAt` | Rejeitar no create/update (já existe parcialmente) |
| Rodada `OPEN` passou `closeAt` e job falhou | `CreateTicketService` bloqueia por `closeAt` |
| Timezone | Usar UTC no backend; frontend envia ISO; exibir no fuso do admin |

---

## 8. Critérios de aceite

- [ ] Criar rodada com `openAt` futuro → permanece `DRAFT`; usuário **não** palpita.
- [ ] Após `openAt`, job abre → `OPEN`; usuário **palpita**.
- [ ] Após `closeAt`, job fecha → `CLOSED`; usuário **não** palpita.
- [ ] Admin informa resultado e apura manualmente → `SCORED`.
- [ ] Cenário do bug: criar rodada + não clicar "Abrir" → abre sozinha no `openAt`.
- [ ] `openAt` agendado **não é sobrescrito** na abertura automática.
- [ ] Jobs idempotentes e registrados em operational status.
- [ ] UI admin deixa claro que abertura/fechamento são automáticos.

---

## 9. Arquivos prováveis a alterar

### `fantasy12-api`

- `src/services/round/open-round.service.ts`
- `src/services/round/close-round.service.ts`
- `src/services/ticket/create-ticket.service.ts`
- `src/services/round/get-open-round.service.ts`
- `src/controllers/internal/open-round.job.controller.ts` (ou novos controllers)
- `src/routes/internal/jobs.routes.ts`
- `docs/jobs-current.md`
- `prisma/schema.prisma` (opcional: `openedAt`, `predictionsClosedAt`)

### `fantasy12-frontend`

- `src/pages/AdminRound.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Ticket.tsx` (mensagens de prazo)

### `fantasy12-infra`

- Cron/Cloud Scheduler para os dois jobs (1 min)

---

## 10. Fora de escopo (neste ajuste)

- Apuração automática ao fechar palpites.
- Notificação push/email "rodada abriu".
- Recalcular `closeAt` no backend a partir de `matchTime` (pode ficar só no frontend inicialmente).

---

## 11. Referência visual (print admin)

Tela **Nova Rodada**:

- Título: *"Programar abertura e fechamento"*
- Subtítulo: *"O backend cria a próxima sequência automaticamente."* ← hoje verdadeiro só para `number`; estender para abertura/fechamento.
- Campos: **Abertura**, **Fechamento** (`datetime-local`)
- Botão: **Criar rodada**
- Abaixo: **Jogos da rodada** (12 confrontos com `matchTime`)
