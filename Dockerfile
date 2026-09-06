# Multi-stage сборка. Всё работает на одноплатнике (linux/arm64), без внешних сервисов.
#   docker compose build         — оба сервиса
#   docker compose up -d
#
# Цели:
#   web  — nginx + статическая сборка Vite (dist/)
#   app  — Node-сервер (SQLite + JWT + загрузка фото)

# ── 1) Сборка фронтенда ─────────────────────────────────────────────────
FROM node:20-alpine AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Относительные пути API: в проде nginx проксирует /api и /uploads на app
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── 2) Зависимости бэкенда (отдельно, чтобы кэшировать слой) ────────────
FROM node:20-alpine AS app-deps
WORKDIR /app
COPY server/package.json ./
# Инструменты сборки — страховка, если для better-sqlite3 не найдётся
# готового prebuild под вашу платформу; удаляются сразу после npm install
RUN apk add --no-cache python3 make g++ \
    && npm install --omit=dev \
    && apk del python3 make g++ \
    && rm -rf /var/cache/apk/*

# ── 3) Рантайм бэкенда ──────────────────────────────────────────────────
FROM node:20-alpine AS app
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data
COPY --from=app-deps /app/node_modules ./node_modules
COPY server/package.json server/index.js ./
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/portfolio >/dev/null || exit 1
CMD ["node", "index.js"]

# ── 4) Статика (nginx) ──────────────────────────────────────────────────
FROM nginx:1.27-alpine AS web
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/dist /usr/share/nginx/html
VOLUME ["/data"]
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
CMD ["nginx", "-g", "daemon off;"]
