# Não Esqueci — build do front (Vite) + servidor Node leve num só container.
# O servidor (server/index.js) serve o dist/ estático e expõe /api/nfce e /api/health.

# ── build: instala tudo, roda testes (guard rail) e gera dist/ ──────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm test
RUN npm run build

# ── runtime: só deps de produção + dist/ + servidor ────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "server/index.js"]
