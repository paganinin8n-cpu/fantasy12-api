############################
# STAGE 1 — BUILD
############################
FROM node:20-bullseye AS build

WORKDIR /app

# Dependências do sistema
RUN apt-get update && apt-get install -y \
  openssl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package*.json ./

# Instalar TODAS as dependências de forma reproduzível (inclui dev)
RUN npm ci

# Copiar código
COPY . .

# Identifica a revisão servida pelo endpoint /health. Builds locais não
# empacotados pelo workflow usam um valor explícito e seguro.
RUN test -s .release-version || printf 'unknown\n' > .release-version

# Prisma Client (necessário para build)
RUN npx prisma generate

# Build TypeScript
RUN npm run build


############################
# STAGE 2 — RUNTIME
############################
FROM node:20-bullseye

WORKDIR /app

# Dependências mínimas do sistema
RUN apt-get update && apt-get install -y \
  openssl \
  ca-certificates \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Copiar apenas o necessário
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/.release-version ./.release-version

# Prisma Client runtime
RUN npx prisma generate

EXPOSE 3001
EXPOSE 3002

# Default HEALTHCHECK targets the API. Worker containers should override with
# WORKER_HEALTH_PORT (default 3002) /health.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3001}/health" >/dev/null || exit 1

CMD ["sh", "./scripts/start-production.sh"]
