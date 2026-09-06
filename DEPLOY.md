# Деплой сайта-портфолио — подробная инструкция

Пошаговый план: от пустого репозитория до работающего продакшена с боевым
Supabase. Займёт ~30 минут.

**Оглавление**

1. [Что нужно перед стартом](#1-что-нужно-перед-стартом)
2. [Шаг 1. Supabase: база, RLS, хранилище](#2-шаг-1-supabase-база-rls-хранилище)
3. [Шаг 2. Переменные окружения](#3-шаг-2-переменные-окружения)
4. [Шаг 3. Хостинг](#4-шаг-3-хостинг-выберите-один-вариант)
   - [Вариант A. Vercel (рекомендуется)](#вариант-a-vercel-рекомендуется)
   - [Вариант B. Netlify](#вариант-b-netlify)
   - [Вариант C. Cloudflare Pages](#вариант-c-cloudflare-pages)
   - [Вариант D. GitHub Pages](#вариант-d-github-pages)
   - [Вариант E. Свой VPS + Nginx](#вариант-e-свой-vps--nginx)
5. [Шаг 4. Наполнение: фото и проекты](#5-шаг-4-наполнение-фото-и-проекты)
6. [Шаг 5. Финальный чек-лист](#6-шаг-5-финальный-чек-лист)
7. [Обновления и откат](#7-обновления-и-откат)
8. [Частые проблемы](#8-частые-проблемы)

---

## 1. Что нужно перед стартом

- Аккаунт на [GitHub](https://github.com) (репозиторий с кодом).
- Аккаунт на [Supabase](https://supabase.com) (бесплатного тарифа Free достаточно).
- Аккаунт на любом хостинге статики: Vercel / Netlify / Cloudflare Pages / GitHub Pages.
- (Опционально) Свой домен — на всех хостингах выше SSL-сертификат ставится автоматически.

**Почему это просто:** приложение — чистая статика после `npm run build`
(папка `dist/`). Маршрутизация — HashRouter, поэтому серверные rewrite-правила
не нужны: любой хостинг статики работает «из коробки».

**Демо-режим:** если переменные Supabase не заданы, сайт автоматически
работает на встроенном датасете, а Supabase SDK вообще не попадает в бандл.
Так что деплой «без базы» — тоже полностью рабочий сайт (админка в этом
случае — демо, не для продакшена).

---

## 2. Шаг 1. Supabase: база, RLS, хранилище

### 2.1. Создайте проект

1. [supabase.com](https://supabase.com) → **New project** → имя, например `portfolio`.
2. Пароль базы — сохраните в менеджер паролей.
3. Регион — ближайший к аудитории (Frankfurt для России/Европы).
4. Дождитесь статуса **Active** (~1 минута).

### 2.2. Создайте таблицы и RLS

Откройте **SQL Editor → New query** и выполните скрипт целиком:

```sql
-- ── Функция проверки админа (обходит RLS на admins — SECURITY DEFINER) ──
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.admins
    where email = auth.email()
  );
end;
$$;

-- ── Таблицы ──
create table public.categories (
  id   uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique
);

create table public.projects (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  slug            text unique,
  description     text,
  location        text,
  date            date,
  category_id     uuid references public.categories (id),
  cover_image_url text
);
create index idx_projects_slug on public.projects (slug);

create table public.photos (
  id            uuid default gen_random_uuid() primary key,
  project_id    uuid not null references public.projects (id) on delete cascade,
  image_url     text not null,
  width         integer,
  height        integer,
  exif_camera   text,
  exif_lens     text,
  exif_settings text,
  sort_order    integer default 0
);

create table public.admins (
  id    uuid default gen_random_uuid() primary key,
  email text not null unique
);

create table public.inquiries (
  id      uuid default gen_random_uuid() primary key,
  name    text not null,
  email   text not null,
  type    text,
  message text not null,
  created_at timestamptz default now()
);

-- ── RLS: чтение всем, запись — только админам ──
alter table public.categories enable row level security;
alter table public.projects   enable row level security;
alter table public.photos     enable row level security;
alter table public.admins     enable row level security;
alter table public.inquiries  enable row level security;

create policy "categories read all"  on public.categories for select using (true);
create policy "categories admin"     on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "projects read all"    on public.projects for select using (true);
create policy "projects admin"       on public.projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "photos read all"      on public.photos for select using (true);
create policy "photos admin"         on public.photos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins read all"      on public.admins for select using (true);
create policy "admins admin"         on public.admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Заявки: вставка анонимам (форма на сайте), чтение/удаление — админам
create policy "inquiries insert"     on public.inquiries for insert to anon, authenticated
  with check (true);
create policy "inquiries admin read" on public.inquiries for select to authenticated
  using (public.is_admin());
create policy "inquiries admin del"  on public.inquiries for delete to authenticated
  using (public.is_admin());

-- ── Начальные категории (6 жанров сайта) ──
insert into public.categories (name, slug) values
  ('Улица',          'street'),
  ('Портрет',        'portraits'),
  ('Архитектура',    'architecture'),
  ('Натюрморт',      'still-life'),
  ('Пейзаж',         'landscapes'),
  ('Чёрно-белое',    'bw');
```

### 2.3. Хранилище для фото

1. **Storage → New bucket** → имя `photos` → включите **Public bucket** → Create.
2. **Storage → photos → Policies** (или SQL Editor) — выполните:

```sql
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

create policy "photos public read"  on storage.objects for select
  using (bucket_id = 'photos');
create policy "photos admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_admin());
create policy "photos admin update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.is_admin());
create policy "photos admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_admin());
```

> Бакет публичный на чтение (фото и должны смотреть все), а запись/удаление
> разрешены только админам — это и защищает файлы.

### 2.4. Создайте админа

1. **Authentication → Users → Add user** → email `arseniy.babanov@yandex.ru`,
   пароль (придумайте), галочка **Auto confirm user** → Create.
2. В SQL Editor выполните:

```sql
insert into public.admins (email) values ('arseniy.babanov@yandex.ru');
```

> Это «bootstrap первого админа»: пока таблица `admins` пуста, никто не может
> в неё писать (RLS), поэтому первая строка добавляется вручную из SQL Editor —
> он работает с правами service role и обходит RLS.

### 2.5. Скопируйте ключи

**Project Settings → API**:

- `Project URL` — например `https://abcdefgh.supabase.co`
- `anon public` key — длинная строка JWT.

> **Важно о безопасности:** `anon`-ключ **безопасно** класть в код сайта — он
> публичный по дизайну Supabase. Реальную защиту обеспечивают RLS-политики
> (выше) и `service_role`-ключ, который **никогда** не должен попадать
> в переменные с префиксом `VITE_`.

---

## 3. Шаг 2. Переменные окружения

Для локальной разработки создайте файл `.env` в корне проекта
(он уже в `.gitignore` — не попадёт в репозиторий):

```bash
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Проверка: `npm run dev` → откройте `/#/admin/login` — плашка «Демо-режим»
должна исчезнуть, вход теперь через реальный Supabase Auth.

Для продакшена эти же две переменные задаются **в панели хостинга**
(см. ниже), а не в файле.

> Если переменных нет — сборка проходит, сайт работает в демо-режиме,
> а Supabase SDK tree-shake'ом удаляется из бандла (проверено: 0 байт).

---

## 4. Шаг 3. Хостинг (выберите один вариант)

Для всех вариантов: **Build command** — `npm run build`,
**Output directory** — `dist`.

### Вариант A. Vercel (рекомендуется)

1. Запушьте код на GitHub:

   ```bash
   git init
   git add -A
   git commit -m "Portfolio site"
   git branch -M main
   git remote add origin git@github.com:ВАШ_ЛОГИН/portfolio.git
   git push -u origin main
   ```

2. [vercel.com](https://vercel.com) → **Add New → Project** → Import из GitHub.
3. Vercel сам определит **Framework Preset: Vite** (проверьте: Build `npm run build`, Output `dist`).
4. **Environment Variables** → добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
5. **Deploy**. Через ~1 минуту сайт доступен по адресу `https://проект.vercel.app`.

**Свой домен:** Settings → Domains → добавьте `babanov.photo` → у регистратора
домена пропишите DNS из подсказок Vercel (обычно A-запись `76.76.21.21`
или CNAME на `cname.vercel-dns.com`). SSL выпустится автоматически.

Каждый `git push` в `main` — автоматический деплой; pull request'ы получают
отдельные preview-адреса.

### Вариант B. Netlify

1. [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project** → GitHub.
2. Build command `npm run build`, Publish directory `dist`.
3. **Site configuration → Environment variables** → те же две переменные.
4. Deploy.

**Свой домен:** Domain settings → Add custom domain (DNS по инструкции Netlify).

> Серверные redirect-правила (`_redirects`, `netlify.toml`) **не нужны**:
> HashRouter (`/#/portfolio`) не требует перезаписей — Netlify отдаёт один
> `index.html`, а роутингом занимается браузер.

### Вариант C. Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Build command `npm run build`, Output `dist`.
3. Переменные окружения — в настройках проекта (Settings → Environment variables).
4. Бонус: бесплатный CDN и неограниченный трафик.

### Вариант D. GitHub Pages

Подходит для адреса вида `username.github.io` (корень) или своего домена.
Для подсайта `username.github.io/repo` потребуется поменять `base` в
vite.config.ts на `/repo/` — если это ваш случай, скажите, поправлю.

1. Settings репозитория → **Pages → Source: GitHub Actions**.
2. Создайте файл `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
           env:
             VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
             VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

3. Settings → **Secrets and variables → Actions** → добавьте
   `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
4. Push в `main` — деплой запустится сам.

### Вариант E. Свой VPS + Nginx

1. Соберите локально с переменными:

   ```bash
   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run build
   ```

2. Скопируйте содержимое `dist/` на сервер (`scp -r dist/* user@server:/var/www/portfolio/`).
3. Конфиг Nginx (`/etc/nginx/sites-available/portfolio`):

   ```nginx
   server {
       listen 80;
       server_name babanov.photo www.babanov.photo;

       root /var/www/portfolio;
       index index.html;

       # HashRouter: все пути отдают один index.html
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Долгий кэш для файлов с хэшем в имени
       location /assets/ {
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       gzip on;
       gzip_types text/css application/javascript image/svg+xml;
   }
   ```

4. `ln -s`, `nginx -t`, `systemctl reload nginx`, затем `certbot --nginx -d babanov.photo`
   для бесплатного HTTPS.

---

## 5. Шаг 4. Наполнение: фото и проекты

Демо-данные уступят место боевым автоматически — заполнять удобно прямо
из админки на уже задеплоенном сайте:

1. **Проекты:** `/#/admin/projects` → «Новый проект»: название, категория,
   дата, локация, описание. Slug (адрес страницы) генерируется сам
   (кириллица транслитерируется), можно задать вручную.
2. **Кадры:** `/#/admin/upload` → перетащите фото, выберите проект,
   заполните EXIF. Файл уходит в Storage-бакет `photos`, строка — в таблицу.
   Реальные `width/height` читаются из файла и держат masonry-сетку без прыжков.
3. **Обложка проекта** — поле `cover_image_url` (ссылка из Storage:
   в бакете у файла → **Get URL**).
4. **Порядок кадров** — поле `sort_order` (в пределах проекта).
5. **Удаление** — в `/#/admin/manage`: кнопка «Удалить» → окно «Вы уверены?» →
   файл стирается и из Storage, и из базы.

> Рекомендации: JPEG, ширина 2000–2400 px, качество 80–85%, sRGB.
> Обложки проектов — вертикальные 3:4.

**Заявки с формы** накапливаются в таблице `inquiries`
(Table Editor → inquiries) — имя, email, тип съёмки, сообщение, время.

---

## 6. Шаг 5. Финальный чек-лист

Публичная часть:

- [ ] Главная открывается, фото грузится, анимации работают.
- [ ] Портфолио: все 6 фильтров (включая «Чёрно-белое») дают непустые сетки.
- [ ] Лайтбокс: листается стрелками, закрывается по Esc.
- [ ] Страница проекта открывается из карточки, «Следующий проект» ведёт дальше.
- [ ] Форма на `/#/contact` отправляется → строка появилась в `inquiries`.
- [ ] В консоли браузера (F12) нет красных ошибок.

Админка и безопасность:

- [ ] `/#/admin` **без входа** редиректит на логин (middleware работает).
- [ ] Вход под админом проходит; вход с чужим email — отклоняется.
- [ ] Загрузка фото из админки видна на сайте; удаление стирает файл из Storage.
- [ ] В Supabase → SQL Editor проверьте RLS «в шкуре анонима»:
      ```sql
      select auth.email();            -- пусто (вы аноним)
      delete from photos where true;  -- должно вернуть 0 строк
      ```

SEO и прочее:

- [ ] `<title>` и og-теги меняются по страницам (посмотрите в элементах devtools).
- [ ] Пришарьте ссылку в Telegram — карточка предпросмотра подтянула обложку.
- [ ] Lighthouse (devtools → вкладка Lighthouse): Performance/Accessibility ≥ 90.
- [ ] Домен + SSL работают (https без предупреждений).

---

## 7. Обновления и откат

- **Vercel / Netlify / CF Pages / GH Pages:** `git push` → автодеплой.
  Откат — вкладка **Deployments → Redeploy/Restore** на предыдущей версии
  (или `git revert` + push).
- **VPS:** пересобрать локально, скопировать `dist/` заново.
- Данные (фото, проекты, заявки) живут в Supabase и **не затрагиваются**
  деплоем — пересборка сайта их не трогает.

---

## 8. Частые проблемы

| Симптом | Причина и решение |
| --- | --- |
| Сайт в демо-режиме на проде | Переменные `VITE_*` не заданы в панели хостинга (`.env` из репозитория не подхватывается) → добавьте и перезапустите деплой |
| `Invalid login credentials` | Пользователь создан в Auth, но нет строки в `admins` → `insert into admins (email) values ('...')` |
| `row-level security policy violation` при загрузке | Сессия не админа, либо RLS-политики Storage не применены → перепроверьте шаг 2.3 |
| Фото не появляется после загрузки | Бакет `photos` не публичный → Storage → photos → make public |
| Белая страница на GitHub Pages (подсайт `/repo/`) | Нужен `base: '/repo/'` в vite.config.ts — скажите, поправлю |
| Пусто в `inquiries` | Включён демо-режим (нет ключей) — заявки в этом режиме никуда не пишутся |

---

Удачного деплоя! Если на каком-то шаге что-то пойдёт не так — пришлите
сообщение об ошибке, разберёмся.
