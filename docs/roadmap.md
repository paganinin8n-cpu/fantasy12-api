# Roadmap de Maturidade

## Princípios

- primeiro consolidar, depois expandir
- evitar criar infra para sustentar contratos quebrados
- transformar decisões implícitas em decisões documentadas
- reduzir risco operacional antes de acelerar entrega

## Fase 0: Diagnóstico e alinhamento

Objetivo:

- criar entendimento comum do estado atual

Entregáveis:

- inventário de rotas backend
- inventário de chamadas do frontend
- mapa de divergências entre contratos
- inventário de variáveis de ambiente
- visão dos ambientes existentes

Critério de saída:

- saber exatamente o que está funcionando, o que está parcial e o que está legado

## Fase 1: Canonização de contratos

Objetivo:

- estabelecer uma API oficial e um fluxo único de autenticação

Entregáveis:

- tabela backend x frontend com status de compatibilidade
- decisão oficial sobre autenticação baseada em sessão
- remoção ou marcação de rotas legadas
- padronização do formato de erro
- camada HTTP única no frontend

Prioridade alta:

- unificar `AuthProvider`
- corrigir endpoints divergentes
- remover `fetch` hardcoded
- corrigir rotas que dependem de autenticação sem middleware explícito

Critério de saída:

- frontend e backend se falam sem remendos locais

## Fase 2: Banco e dados

Objetivo:

- tornar o banco previsível em desenvolvimento e produção

Entregáveis:

- revisão das migrations existentes
- estratégia de baseline e recuperação
- seed documentado
- banco local padronizado
- política de backup e restore
- checklist de mudanças de schema

Critério de saída:

- qualquer dev consegue subir banco, aplicar migrations e popular dados mínimos

## Fase 3: Segurança e hardening

Objetivo:

- remover riscos básicos antes de operar com mais confiança

Entregáveis:

- revisão de sessão, CORS e cookies por ambiente
- remoção de defaults inseguros
- rate limiting
- proteção reforçada de webhooks e jobs internos
- revisão de permissões admin
- plano de gestão de segredos

Critério de saída:

- não depender de configuração frágil para manter segurança mínima

## Fase 4: Criação do `fantasy12-infra`

Objetivo:

- separar operação de aplicação

Entregáveis:

- novo repositório `fantasy12-infra`
- `docker-compose` local
- templates de ambiente
- scripts operacionais
- documentação de deploy
- configuração de banco por ambiente

Critério de saída:

- a infraestrutura deixa de estar implícita ou espalhada

## Fase 5: CI/CD e observabilidade

Objetivo:

- ganhar previsibilidade de entrega e suporte

Entregáveis:

- pipeline de build e validação
- pipeline de deploy
- logs estruturados
- healthchecks úteis
- alarmes básicos para jobs e pagamentos

Critério de saída:

- deploy deixa de ser artesanal e incidentes ficam mais visíveis

## Fase 6: Refino funcional

Objetivo:

- evoluir o produto sobre base sólida

Entregáveis:

- limpeza de código legado
- melhoria de UX
- aumento de cobertura automatizada
- evoluções de monetização e admin com menor risco

## Ordem recomendada de execução

1. consolidar contratos
2. consolidar banco
3. corrigir segurança básica
4. criar `fantasy12-infra`
5. automatizar deploy e observabilidade

## Backlog objetivo imediato

Semana 1:

- mapear rotas reais do backend
- mapear consumo real do frontend
- fechar contrato oficial de auth
- listar variáveis de ambiente e segredos

Semana 2:

- corrigir divergências críticas de integração
- revisar proteção de rotas
- padronizar camada HTTP do frontend
- documentar fluxo de banco local

Semana 3:

- desenhar e criar `fantasy12-infra`
- subir ambiente local integrado
- organizar deploy inicial por ambiente

Semana 4:

- aplicar hardening de segurança
- adicionar observabilidade mínima
- fechar checklist de produção
