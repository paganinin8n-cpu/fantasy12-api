# Atualizacao 2026-05-22

## Resumo

Esta rodada consolidou o bloco de perfil, admin operacional basico e bolões premium.

## Entregue

### Backend

- `POST /api/boloes` para criacao de bolao
- restricao de criacao de bolao para usuario com assinatura PRO anual ativa
- regra de beneficios por rodada ajustada: normal recebe 2 duplas, PRO recebe 4 duplas e 2 super duplas
- `GET /api/benefits/balance` para saldo tatico da rodada e inventario comprado
- `POST /api/benefits/purchase` para comprar duplas e super duplas com fichas
- `/api/me` enriquecido com `nickname`, `phone`, `bio`, `profileImage` e `adminRoles`
- `PATCH /api/me` para edicao de perfil
- `POST /api/me/password` para troca de senha autenticada
- `GET /api/admin/users`
- `GET /api/admin/logs`
- rota de assinaturas admin revisada com autenticacao e permissao administrativa

### Frontend

- perfil editavel
- tela `Admin > Usuarios`
- tela `Admin > Logs`
- criacao visual de bolao para PRO anual
- `BarPage` com `Menu Tatico` para compra de duplas e super duplas
- ticket desabilita duplas e super duplas quando o saldo nao permite nova selecao
- navegacao admin protegida por papel administrativo
- remocao da pagina orfa `src/pages/Ranking.tsx`

### Producao validada

- `https://api.fantasy12.com/health`
- `https://api.fantasy12.com/api/me` com `adminRoles`
- `GET /api/admin/users` com sessao admin
- `GET /api/admin/logs` com sessao admin
- frontend publico servindo bundle novo com as superficies novas

## Pendencias atuais

- observabilidade minima para jobs, pagamentos e erros relevantes
- rotina operacional de backup e restore do Postgres
- checklist de incidente e operacao
- revisar precificacao final das assinaturas: PRO mensal R$ 24,90, PRO anual 12x R$ 9,90 e PIX anual R$ 99,00
- refinamento continuo de bolões, admin e UX principal do jogador
- conclusao do desacoplamento conceitual entre `PRO` e `User.role`

## Recomendacao de proximo bloco

O proximo bloco mais util e operacional:

1. fechar observabilidade minima
2. documentar e testar backup/restore
3. revisar rotina de deploy, incidente e verificacoes pos-deploy
