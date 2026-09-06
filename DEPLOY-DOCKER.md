# Деплой на Banana Pi M4 Zero (Docker, полностью локально)

Сайт работает **целиком на плате**: статика в nginx, данные и файлы — в контейнере
с Node-сервером (SQLite + JWT + загрузка фото). Внешние сервисы не используются:
Supabase, облачные БД и CDN не нужны.

```
Интернет → роутер (80/443) → Banana Pi M4 Zero
                                 ├─ nginx  (web)   статика dist/ + отдача /uploads из volume
                                 └─ node   (app)   /api: SQLite, JWT-вход, multer-загрузки
                                        ↓
                              volume portfolio-data
                              (portfolio.db, uploads/, .jwt_secret)
```

Ресурсы: рантайм ~90–120 МБ ОЗУ из 4 ГБ. Пиковая нагрузка — сборка образа
(Vite + npm, до ~1,5 ГБ), поэтому на время первой сборки полезен swap.

---

## 1. Подготовка платы

Подойдёт Armbian / Debian bookworm (в образах Banana Pi OS тоже есть всё нужное).

```bash
sudo apt update && sudo apt upgrade -y

# Docker + плагин compose
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable --now docker
sudo usermod -aG docker $USER          # затем перелогиниться

# Проверка архитектуры (должно быть aarch64)
uname -m

# Проверка, что порт 80 свободен (в образах BPI бывает предустановлен Apache)
sudo ss -tulpn | grep ':80 '
# если занят: sudo systemctl disable --now apache2
```

**Swap на время сборки** (постоянно не нужен, но спасает от OOM):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 2. Код и переменные

```bash
git clone <URL-вашего-репозитория> ~/portfolio
cd ~/portfolio

# Учётные данные админки (задайте свои!)
cat > .env <<'EOF'
ADMIN_EMAIL=arseniy.babanov@yandex.ru
ADMIN_PASSWORD=придумайте-надёжный-пароль
EOF
```

Если `ADMIN_PASSWORD` не задать, сервер сгенерирует случайный и **напечатает его
в лог при первом запуске** (`docker compose logs app`).

> Переменные `VITE_*` здесь не нужны: фронтенд обращается к API относительными
> путями, а nginx проксирует `/api` и `/uploads` на контейнер app.

---

## 3. Сборка и запуск

```bash
cd ~/portfolio
docker compose up -d --build
```

- Первая сборка на Cortex-A55: **5–15 минут** — это нормально (npm ci + Vite).
- Docker сам возьмёт образы для `linux/arm64`; у `better-sqlite3` есть готовые
  prebuild под ARM64, компиляция обычно не требуется.

Проверка:

```bash
docker compose ps                 # оба сервиса Up
docker compose logs app           # строка «ПЕРВЫЙ ВХОД В АДМИН-ПАНЕЛЬ» (если пароль генерировался)
curl -I http://localhost/         # 200 от nginx
curl http://localhost/api/portfolio   # JSON с категориями (6 шт., уже засеяны)
```

Откройте `http://<IP-платы>/` — сайт работает. Админка: `http://<IP-платы>/#/admin/login`.

---

## 4. Первый вход и наполнение

1. `/#/admin/login` → email/пароль из `.env` (или из `docker compose logs app`).
2. **Проекты** → создайте серии (название, slug, категория, дата, обложка).
3. **Загрузка кадра** → файл (до 25 МБ) + EXIF; файл кладётся в volume, строка — в БД.
4. Публичное портфолио, фильтры и страницы `/portfolio/<slug>` подхватят данные сразу.
5. Заявки с формы контактов копятся в **Заявках** (раздел админки).

---

## 5. Доступ из интернета

1. На роутере: проброс `80` (и `443`) на IP платы.
2. Домен: A-запись на ваш внешний IP; при «сером»/динамическом IP — DDNS
   (`ddclient` на плате + поддержка у регистратора).
3. **HTTPS** — в `docker-compose.yml` раскомментируйте сервис `caddy`
   и впишите домен в `deploy/Caddyfile`. Caddy сам выпустит и будет продлевать
   сертификат Let's Encrypt (нужны открытые 80/443 и публичный домен).
   > При включённом caddy уберите проброс 80 на web: caddy займёт 80/443 сам.

---

## 6. Обновление сайта

```bash
cd ~/portfolio
git pull
docker compose build web          # фронтенд (app — только если менялся server/)
docker compose up -d
```

Данные лежат в volume и при пересборке **не затрагиваются**.
`index.html` отдаётся с `no-cache`, поэтому пользователи увидят новую версию сразу.

---

## 7. Резервное копирование и перенос

Весь сайт (БД, фото, секрет сессий) — в volume `portfolio-data`:

```bash
# Бэкап
docker compose stop app
sudo tar -czf portfolio-backup-$(date +%F).tar.gz \
  -C /var/lib/docker/volumes/portfolio_portfolio-data _data
docker compose start app

# Восстановление на этой же или другой плате
docker compose stop app
sudo tar -xzf portfolio-backup-*.tar.gz \
  -C /var/lib/docker/volumes/portfolio_portfolio-data
docker compose start app
```

(имя volume уточните в `docker volume ls`)

---

## 8. Локальная разработка (без Docker)

```bash
# 1) бэкенд (порт 3000, данные в server/data)
cd server && npm install
ADMIN_EMAIL=admin@localhost ADMIN_PASSWORD=secret123 npm start

# 2) фронтенд (порт 5173)
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.development
npm run dev
```

---

## 9. Частые проблемы

| Симптом | Причина / решение |
| --- | --- |
| `exec format error` при запуске | Образ собран не под ARM64. Собирайте на плате, либо на ПК: `docker buildx build --platform linux/arm64 ...` |
| Сборка падает с OOM (137) | Включите swap (раздел 1) |
| Порт 80 занят | `sudo ss -tulpn \| grep ':80 '` → выключите apache2/nginx с платы |
| 502 на `/api/...` | Контейнер app не поднялся: `docker compose logs app` |
| После деплоя «сайт без фото» | Фото лежат в volume; проверьте, что volume смонтирован у обоих сервисов (`docker compose config`) |
| Забыл пароль админки | Задать `ADMIN_PASSWORD`, удалить строку админа в БД или volume целиком — сервер пересоздаст при старте |
| Сессии слетают после пересборки | Секрет JWT хранится в volume; не удаляйте `portfolio-data` |
