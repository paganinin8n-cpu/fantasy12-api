# Arquitetura Alvo

## Objetivo

Levar a plataforma Fantasy12 para uma estrutura em que produto, operação e segurança estejam organizados de forma previsível.

## Repositórios alvo

### `fantasy12-api`

Responsabilidades:

- domínio de negócio
- autenticação e autorização
- integração com pagamentos e webhooks
- regras de rodada, ranking, assinatura, carteira e benefícios
- migrations Prisma
- contratos oficiais da API

Não deve concentrar:

- scripts de deploy do ambiente
- infraestrutura de banco, proxy e observabilidade
- segredos de ambiente versionados

### `fantasy12-frontend`

Responsabilidades:

- SPA web
- experiência do usuário
- integração com API canônica
- guards de rota e estado de sessão do lado cliente
- contratos tipados consumindo o backend

Não deve concentrar:

- lógica de autenticação paralela
- chamadas hardcoded fora da camada HTTP
- contratos divergentes do backend

### `fantasy12-infra`

Responsabilidades:

- ambiente local padronizado
- infraestrutura de deploy
- banco de dados por ambiente
- reverse proxy e SSL quando aplicável
- observabilidade básica
- pipelines operacionais
- templates de `.env`
- backup e restore
- automações de jobs operacionais

## Proposta de escopo inicial para `fantasy12-infra`

Estrutura sugerida:

- `docker-compose.yml`
- `environments/`
- `postgres/`
- `proxy/`
- `scripts/`
- `docs/`
- `monitoring/`
- `.env.example`

Conteúdo mínimo da v1:

- Postgres local para desenvolvimento
- serviço da API
- serviço do frontend
- proxy opcional
- scripts de bootstrap
- documentação de subida local
- documentação de deploy
- política de backup inicial

## Banco de dados na arquitetura alvo

Fonte de verdade:

- `schema.prisma` em `fantasy12-api`

Princípios:

- schema Prisma é a referência lógica
- migrations versionadas são obrigatórias
- seeds devem ser idempotentes quando possível
- cada ambiente deve ter banco próprio
- backup e restauração devem ser testados

Ambientes recomendados:

- `local`
- `staging`
- `production`

## Integração entre frontend e backend

Princípios de contrato:

- backend é soberano nos contratos HTTP
- frontend consome apenas endpoints canonizados
- autenticação deve seguir um único modelo
- respostas de erro devem ter formato previsível
- rotas antigas devem ser removidas ou explicitamente mantidas como legado temporário

## Modelo alvo de autenticação

Recomendação para o estágio atual:

- manter autenticação baseada em sessão com cookie HttpOnly
- usar `withCredentials` no frontend
- centralizar bootstrap do usuário em `/api/me`
- remover dependência de token no frontend, exceto se houver uma decisão explícita de migrar para JWT

Se futuramente houver necessidade de API pública, mobile ou integrações de terceiros, a plataforma pode reavaliar JWT/OAuth. Hoje o ganho maior está em consolidar o que já existe.

## Segurança na arquitetura alvo

Mínimos obrigatórios:

- CORS por ambiente e configurável via env
- `helmet`
- `secure`, `httpOnly` e `sameSite` definidos conforme ambiente
- rate limiting nas rotas sensíveis
- segredo de sessão sem fallback inseguro
- proteção e assinatura de webhooks
- RBAC consistente em rotas admin
- logs e auditoria para operações críticas
- política de backup e retenção

## Observabilidade mínima

Para sair do estágio atual:

- logs estruturados
- healthcheck real de app e banco
- rastreio de falhas em jobs internos
- registro de eventos de pagamento e webhook
- alertas básicos para erro de deploy, falha de job e falha de pagamento

## Critério de arquitetura madura

A plataforma passa a um estágio mais maduro quando:

- backend e frontend compartilham contratos consistentes
- ambiente local sobe com processo previsível
- banco é governado por migrations e backups
- infraestrutura fica separada do domínio
- segredos e acessos ficam organizados por ambiente
- segurança mínima deixa de depender de defaults inseguros
