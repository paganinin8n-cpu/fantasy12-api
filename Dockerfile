############################
# STAGE 1 — BUILD
############################
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache ca-certificates openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Identifica exatamente os insumos servidos pelo endpoint /health.
RUN node scripts/release-fingerprint.js > .release-version

RUN npx prisma generate
RUN npm run build

# Prisma CLI permanece como dependência operacional; compiladores, tipos,
# ts-node e demais dependências de desenvolvimento são removidos.
RUN npm prune --omit=dev && npm cache clean --force


############################
# STAGE 2 — RUNTIME
############################
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache ca-certificates curl openssl \
  && mkdir -p /app/backups \
  && chown -R node:node /app

COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/.release-version ./.release-version

USER node

EXPOSE 3001
EXPOSE 3002

# Default HEALTHCHECK targets the API. Worker containers may override PORT
# with WORKER_HEALTH_PORT (default 3002).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-3001}/health" >/dev/null || exit 1

CMD ["sh", "./scripts/start-production.sh"]
