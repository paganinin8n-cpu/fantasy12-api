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

# Instalar TODAS as dependências (inclui dev)
RUN npm install

# Copiar código
COPY . .

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
  && rm -rf /var/lib/apt/lists/*

# Copiar apenas o necessário
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Prisma Client runtime
RUN npx prisma generate

EXPOSE 3001

# 🔒 Runtime startup:
# 1️⃣ aplica migrations
# 2️⃣ inicia a API
CMD sh -c "npx prisma migrate deploy && node dist/index.js"
