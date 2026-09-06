# syntax=docker/dockerfile:1
#
# Сайт-портфолио: многоэтапная сборка.
# Этап 1 собирает статику (Vite), этап 2 раздаёт её nginx'ом.
# Итоговый образ — linux/arm64-совместимый (Banana Pi M4 Zero, Raspberry Pi,
# любой aarch64-сервер), итоговый размер ~45 МБ, в рантайме ~10 МБ ОЗУ.

# ── Этап 1. Сборка ─────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Зависимости отдельным слоем — кэш жив, пока package*.json не менялись
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# VITE_* встраиваются в бандл НА ЭТАПЕ СБОРКИ (особенность Vite).
# Значения приходят из docker-compose (args) → .env файл.
# Без ключей соберётся полностью рабочий демо-режим.
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY . .
RUN npm run build

# ── Этап 2. Раздача ────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Liveness-проверка: пригодится для docker compose ps / оркестраторов
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
