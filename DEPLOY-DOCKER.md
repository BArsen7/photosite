# Деплой через Docker на Banana Pi M4 Zero (4 ГБ ОЗУ)

Пошаговое развёртывание сайта-портфолио на одноплатнике **Banana Pi M4 Zero**
(Rockchip RK3566, 4×Cortex-A55, **aarch64**, 4 ГБ ОЗУ).

```
                        ┌──────────────────────────────────────────┐
  Интернет ──► роутер ──► Banana Pi M4 Zero                        │
         (проброс 80/443) │  docker compose                        │
                        │   ├─ web    nginx:alpine (dist/, ~10 МБ) │
                        │   └─ caddy  (опц., авто-HTTPS)           │
                        └────────────┬─────────────────────────────┘
                                     │ HTTPS, данные на лету (из браузера)
                                     ▼
                        Supabase Cloud: Postgres · Auth · Storage
```

**Ключевая мысль:** фронтенд полностью статический — на плате живёт только
nginx. Все данные, авторизация и файлы фотографий обрабатываются Supabase
Cloud напрямую из браузера посетителя. 4 ГБ ОЗУ для этого — с огромным запасом.

---

## 1. Подготовка платы

### 1.1. ОС и архитектура

Подойдут Banana Pi OS (Debian) или Armbian. Проверьте архитектуру — должна быть
`aarch64`:

```bash
uname -m
# ожидаемо: aarch64

cat /etc/os-release
```

### 1.2. Установка Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker

# чтобы работать без sudo:
sudo usermod -aG docker $USER
newgrp docker   # или перелогиньтесь

# проверка:
docker run --rm hello-world
docker compose version
```

### 1.3. Освободите порт 80

В образах Banana Pi OS с рабочего стола может быть поднят Apache:

```bash
sudo systemctl status apache2 2>/dev/null && sudo systemctl disable --now apache2
```

### 1.4. Swap на время сборки (рекомендуется)

Сборка Vite внутри контейнера в пике потребляет ~1–1.5 ГБ. На 4 ГБ платы этого
хватает, но страховка не помешает:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 2. Код на плате

Вариант А — через Git (рекомендуется, удобно обновляться):

```bash
sudo apt install -y git
cd ~ && git clone <URL-ВАШЕГО-РЕПОЗИТОРИЯ> portfolio && cd portfolio
```

Вариант Б — копирование папки с ПК:

```bash
# на ПК (из папки проекта):
tar --exclude=node_modules --exclude=.git -czf portfolio.tar.gz .
scp portfolio.tar.gz <user>@<IP-платы>:~/portfolio/

# на плате:
mkdir -p ~/portfolio && cd ~/portfolio && tar -xzf portfolio.tar.gz
```

---

## 3. Переменные окружения

Создайте `.env` рядом с `docker-compose.yml` (значения — из
Supabase → Settings → API):

```bash
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://ВАШ-ПРОЕКТ.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
EOF
chmod 600 .env
```

> Важно: Vite встраивает эти значения в JS **при сборке образа**. Поменяли
> ключи — пересоберите образ (`docker compose build web`).
>
> Без `.env` соберётся полностью рабочий **демо-режим** (локальный датасет,
> вход в админку: `arseniy.babanov@yandex.ru` + любой пароль от 6 символов).

---

## 4. Сборка и запуск

### 4.1. Сборка прямо на плате

```bash
cd ~/portfolio
docker compose build web     # ~5–15 минут на Cortex-A55 — это нормально
docker compose up -d
```

### 4.2. Альтернатива: собрать на ПК и перенести образ

Если не хочется грузить плату сборкой (или исходники не хочется класть на плату):

```bash
# на ПК (нужен Docker Desktop / buildx):
docker buildx build --platform linux/arm64 \
  --build-arg VITE_SUPABASE_URL="https://..." \
  --build-arg VITE_SUPABASE_ANON_KEY="eyJ..." \
  -t babanov-portfolio:latest --load .

docker save babanov-portfolio:latest | gzip > portfolio-arm64.tar.gz
scp portfolio-arm64.tar.gz <user>@<IP-платы>:~/

# на плате:
gunzip -c ~/portfolio-arm64.tar.gz | docker load
cd ~/portfolio
docker compose up -d --no-build
```

### 4.3. Проверка

```bash
docker compose ps                # статус: running (healthy)
docker compose logs -f web       # логи nginx
curl -I http://localhost/        # HTTP/1.1 200 OK
```

Откройте `http://<IP-платы>/` с любого устройства в локальной сети.
Админка: `http://<IP-платы>/#/admin`.

---

## 5. Доступ из интернета

### 5.1. Статический адрес платы

Закрепите за платой IP в DHCP-настройках роутера (или задайте статический
в `/etc/network/interfaces` / NetworkManager).

### 5.2. Проброс портов

В панели роутера: внешний порт **80** (и **443**, если будет Caddy) →
внутренний IP платы, те же порты, протокол TCP.

### 5.3. Домен

- Купите домен и создайте **A-запись** на ваш белый IP.
- Если IP динамический — настройте DDNS (например, `ddclient`):

```bash
sudo apt install -y ddclient
# настройка: sudo dpkg-reconfigure ddclient
```

### 5.4. Фаервол (опционально)

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 6. HTTPS через Caddy (автосертификат Let's Encrypt)

Caddy сам выпускает и продлевает сертификат — никакого certbot.

1. Впишите свой домен в `deploy/Caddyfile` (вместо `babanov.photo`).
2. Отредактируйте `docker-compose.yml`:

   - в сервисе `web`: закомментируйте `- "80:80"` и раскомментируйте
     `- "127.0.0.1:8080:80"`;
   - раскомментируйте сервис `caddy` и блок `volumes` в конце файла.

3. Запустите:

```bash
docker compose up -d --build
docker compose logs -f caddy     # следите за получением сертификата
```

Через минуту сайт доступен по `https://ваш-домен` с валидным сертификатом.

---

## 7. Обновление сайта

```bash
cd ~/portfolio
git pull                        # или распакуйте свежий tar.gz
docker compose build web        # пересборка (секреты — из .env)
docker compose up -d            # nginx подменит контейнер за пару секунд
```

Данные в Supabase при этом **не затрагиваются** — база живёт в облаке.

---

## 8. Наблюдение и обслуживание

```bash
docker stats                    # ОЗУ/CPU в реальном времени (nginx: ~10 МБ)
docker compose logs --tail=50 web
docker system prune -f          # очистка старых слоёв после обновлений
```

Логи контейнера ограничены в compose (3 файла по 5 МБ) — диск не забьётся.

### Про «а если Supabase тоже локально?»

Полный self-hosted Supabase на 4 ГБ **запустится впритык**
(Postgres + GoTrue + PostgREST + Storage + Kong ≈ 2.5–3 ГБ, Studio лучше
отключить). Для сайта-портфолио разумнее Supabase Cloud (Free-тарифа хватает
с запасом), а плату оставить под фронтенд — так система дышит свободно.

---

## 9. Частые проблемы

| Симптом | Причина | Решение |
| --- | --- | --- |
| `port is already allocated` | Порт 80 занят | `sudo systemctl stop apache2` (или nginx вне Docker) |
| Сайт открылся, но данные демо-режима | Ключи не попали в образ | Проверьте `.env`, затем `docker compose build --no-cache web && docker compose up -d` |
| Сборка падает с OOM | Не хватило ОЗУ на `npm run build` | Добавьте swap (п. 1.4) или соберите образ на ПК (п. 4.2) |
| `docker compose` не найден | Старый `docker-compose` | `sudo apt install docker-compose-plugin` |
| Домен не открывается снаружи | Проброс/DNS/DDNS | Проверьте `curl ifconfig.me` = IP в A-записи; роутер-проброс |
| Caddy не получает сертификат | Порт 80/443 закрыт извне | Откройте проброс; проверьте, что домен указывает на ваш IP |
| `exec format error` | Образ собран под x86_64 | Пересоберите с `--platform linux/arm64` или прямо на плате |

---

## 10. Итоговая памятка команд

```bash
# первый запуск
docker compose up -d --build

# обновление
git pull && docker compose build web && docker compose up -d

# статус / логи / перезапуск
docker compose ps
docker compose logs -f
docker compose restart
```
