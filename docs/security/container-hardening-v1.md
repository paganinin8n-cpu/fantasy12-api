# Hardening de container e runtime — MVP V1

Baseline operacional do SEC-012:

- build e runtime usam `node:22-alpine`, uma linha LTS suportada;
- a imagem é multi-stage e executa API ou worker como usuário `node`, nunca root;
- `npm prune --omit=dev` remove TypeScript, ts-node, tipos e ferramentas de
  desenvolvimento;
- Prisma CLI permanece em dependências de produção porque o processo de deploy
  executa `prisma migrate deploy/status` dentro do contêiner ativo;
- npm, npx, Corepack, Yarn e pnpm globais são removidos do runtime; migrations
  chamam diretamente o binário local e versionado do Prisma;
- o runtime contém `dist`, Prisma, scripts operacionais, healthcheck e diretório
  gravável exclusivo para backups;
- Trivy escaneia pacotes do sistema e bibliotecas e bloqueia achados `HIGH` ou
  `CRITICAL`, inclusive quando ainda não há correção disponível;
- o CI inicia uma inspeção efêmera da imagem e confirma UID, Node 22, API,
  worker, Prisma, ausência das dependências dev e healthcheck;
- após o rollout, o deploy repete UID, Node, artefatos e dependências no
  contêiner ativo antes de concluir.

## Rollback

A alteração não muda schema nem contrato HTTP. Em caso de incompatibilidade do
runtime, republicar o release anterior restaura a imagem Node 20; migrations
permanecem backward-compatible e são aplicadas antes do rollout como já
documentado no pipeline.

## V2

Ficam para V2: imagem base fixada por digest, renovação automatizada, SBOM,
assinatura/proveniência, filesystem somente leitura, capabilities mínimas e
seccomp validado com os scripts operacionais.
