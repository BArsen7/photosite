# Арсений Бабанов — сайт-портфолио фотографа

Тёмный минималистичный сайт-портфолио с акцентом на фотографии: публичная витрина
(главная, портфолио с фильтрами и лайтбоксом, страницы проектов, «обо мне»,
контакты) и закрытая админ-панель «Тёмная комната» для управления архивом.

**Полностью автономный**: никаких внешних сервисов. Данные — SQLite, файлы фото —
на диске, вход в админку — локальный JWT. Целевой деплой — Docker на одноплатнике
(Banana Pi M4 Zero, 4 ГБ ОЗУ). Пошаговая инструкция — в [DEPLOY-DOCKER.md](./DEPLOY-DOCKER.md).

---

## Архитектура

```
браузер → nginx (web)
            ├─ /           статика (Vite build, dist/)
            ├─ /api/*      → app: Node + Express + SQLite (JWT, bcrypt, multer)
            └─ /uploads/*  → файлы фото из volume portfolio-data
```

## Стек

| Слой | Технология |
| --- | --- |
| Фронтенд | React 18 + TypeScript, сборка Vite, Tailwind CSS 4 |
| Маршрутизация | `react-router-dom` (HashRouter — работает на любом статическом хостинге) |
| Бэкенд | Node 20 + Express, SQLite (`better-sqlite3`), JWT, bcryptjs, multer |
| Раздача | nginx (gzip, кэши, security-заголовки), опционально Caddy для HTTPS |
| Шрифты | Playfair Display (заголовки) · Inter (текст) · JetBrains Mono (EXIF) |

> Структура фронтенда повторяет Next.js App Router: `src/app/layout.tsx`,
> `src/app/page.tsx`, `src/app/admin/*/page.tsx`, `src/middleware.tsx` —
> при желании переносится в Next.js почти 1:1.

---

## Быстрый старт (Docker — основной способ)

```bash
# Учётные данные первого входа (задайте свои)
cat > .env <<'EOF'
ADMIN_EMAIL=arseniy.babanov@yandex.ru
ADMIN_PASSWORD=ваш-пароль
EOF

docker compose up -d --build
docker compose logs app        # если пароль не задан — сгенерированный напечатан здесь
```

- Сайт: `http://localhost/`
- Админка: `http://localhost/#/admin/login`

Подробности (подготовка платы, HTTPS, бэкапы, перенос) — в [DEPLOY-DOCKER.md](./DEPLOY-DOCKER.md).

## Локальная разработка (без Docker)

```bash
# Бэкенд: порт 3000, данные в server/data
cd server && npm install
ADMIN_EMAIL=admin@localhost ADMIN_PASSWORD=secret123 npm start

# Фронтенд: порт 5173
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.development
npm run dev
```

Продакшен-сборка фронтенда: `npm run build` (результат в `dist/`).

---

## Админ-панель

- Защита: все `/admin/*` требуют JWT (клиентский шлюз `RequireAuth`,
  серверный `requireAdmin` на каждом API-роуте).
- Rate limit: 5 попыток входа → пауза 30 с (и на сервере, и в UI);
  заявки с сайта — не чаще 3 в минуту с одного IP.
- Загрузка фото: jpeg/png/webp/gif/avif до 25 МБ, размеры считываются
  автоматически — masonry-сетка не «прыгает».
- Удаление проекта сносит и записи кадров, и сами файлы с диска.

---

## Маршруты

| Путь | Страница |
| --- | --- |
| `/#/` | Главная: полноэкранный кадр, избранные проекты (из архива), призыв к контакту |
| `/#/portfolio` | Фильтры по 6 жанрам, masonry (CSS columns), лайтбокс с EXIF, счётчик «N кадров» |
| `/#/portfolio/:slug` | Проект: sticky-описание, EXIF-бейджи, галерея, переходы между проектами |
| `/#/about` | Манифест, биография со статистикой, выставки и конкурсы |
| `/#/contact` | Услуги + форма заявки (honeypot, валидация, счётчик символов) |
| `/#/admin` | Сводка: счётчики, распределение по жанрам, последние кадры, заявки |
| `/#/admin/upload` | Загрузка кадра: drag-and-drop, EXIF, выбор проекта |
| `/#/admin/projects` | CRUD проектов: название, slug, категория, дата, обложка |
| `/#/admin/manage` | Архив: вкладки «Кадры»/«Проекты», поиск, Load more, удаление с подтверждением |
| `/#/admin/inquiries` | Заявки с формы контактов |
| `/#/admin/login` | Вход (email + пароль, JWT на 7 дней) |

## Оптимизация

- Code splitting: админка — ленивые чанки (`React.lazy`), основной бандл ~76 КБ gzip.
- Изображения: компонент-обёртка с `sizes`, `loading="lazy"`, blur-up,
  фиксация aspect-ratio (CLS = 0).
- Метаданные: динамические title/description/OpenGraph на каждом маршруте.
- Анимации: scroll-reveal, line-mask, scramble-декод, Ken Burns;
  всё уважает `prefers-reduced-motion`.

## Структура

```
├── Dockerfile              # multi-stage: web (nginx+dist) и app (node)
├── docker-compose.yml      # web + app (+ caddy для HTTPS), volume portfolio-data
├── deploy/
│   ├── nginx.conf          # статика + прокси /api + отдача /uploads
│   └── Caddyfile           # авто-HTTPS
├── server/
│   ├── index.js            # API: SQLite, JWT, multer, rate limits
│   └── package.json
└── src/
    ├── app/                # «App Router»: layout, page, admin/*
    ├── components/         # Hero, Gallery-секции, Lightbox, ConfirmDialog, Icons…
    ├── lib/                # api.ts (REST-клиент), auth.ts (JWT), meta, motion
    ├── middleware.tsx      # RequireAuth для /admin/*
    └── data/               # моки «избранного» на главной, пока архив пуст
```
