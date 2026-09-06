# Арсений Бабанов — сайт-портфолио фотографа

Тёмный минималистичный сайт-портфолио с акцентом на фотографии: публичная витрина
(главная, портфолио с фильтрами и лайтбоксом, страницы проектов, «обо мне»,
контакты) и закрытая админ-панель «Тёмная комната» для управления архивом
через Supabase.

Сайт полностью работает **без настроенного Supabase** — в демо-режиме
на локальном датасете. Подключение боевой базы — одна строка в `.env`.

---

## Стек

| Слой | Технология |
| --- | --- |
| Фреймворк | React 18 + TypeScript, сборка Vite |
| Стилизация | Tailwind CSS 4 (дизайн-токены в `src/index.css`) |
| Маршрутизация | `react-router-dom` (HashRouter — работает на любом статическом хостинге) |
| Бэкенд | Supabase: Postgres + Auth + Storage (`@supabase/supabase-js`, `@supabase/ssr`) |
| Иконки | Кастомные inline-SVG (`src/components/Icons.tsx`) |
| Шрифты | Playfair Display (заголовки) · Inter (текст) · JetBrains Mono (EXIF и служебные подписи) |

> Архитектура повторяет Next.js App Router: `src/app/layout.tsx`, `src/app/page.tsx`,
> `src/app/admin/*/page.tsx`, `src/middleware.tsx` — при переносе в Next.js файлы
> переносятся почти 1:1 (замены: HashRouter → App Router, `usePageMeta` → `generateMetadata`,
> клиентский `RequireAuth` → серверный middleware, код для которого уже лежит в комментарии
> в `src/middleware.tsx`).

---

## Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Дев-сервер (http://localhost:5173)
npm run dev

# 3. Продакшен-сборка (результат в dist/)
npm run build

# 4. Локальный просмотр сборки
npm run preview
```

Никаких ключей не требуется: без `.env` сайт поднимается в **демо-режиме**.

### Вход в админку (демо-режим)

- Адрес: `/#/admin/login` (ссылка «Админка» есть в подвале сайта)
- Email: `arseniy.babanov@yandex.ru`
- Пароль: любой, от 6 символов
- Защита от перебора: после 5 неудачных попыток — пауза 30 секунд.

---

## Подключение Supabase

1. Создайте проект на [supabase.com](https://supabase.com).

2. Добавьте переменные окружения в `.env` в корне проекта:

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

   После пересборки клиент появится автоматически: SDK подгружается лениво
   (`src/lib/supabase/browser.ts`) и не попадает в бандл, пока ключи не заданы.

3. **Схема БД** — выполните в SQL Editor (таблицы, RLS-политики и вьюха `photos_public`):

   ```sql
   -- Функция проверки администратора (обходит RLS таблицы admins)
   create or replace function is_admin() returns boolean
   language plpgsql security definer set search_path = public as $$
   begin
     return exists (select 1 from admins where email = auth.email());
   end; $$;

   create table categories (
     id uuid default gen_random_uuid() primary key,
     name text not null unique,
     slug text not null unique
   );

   create table projects (
     id uuid default gen_random_uuid() primary key,
     title text not null,
     slug text unique,                     -- адрес /portfolio/[slug]
     description text,
     location text,
     date date,
     category_id uuid references categories(id),
     cover_image_url text
   );

   create table photos (
     id uuid default gen_random_uuid() primary key,
     project_id uuid not null references projects(id) on delete cascade,
     image_url text not null,
     width integer,
     height integer,
     exif_camera text,
     exif_lens text,
     exif_settings text,
     sort_order integer default 0
   );

   create table admins (
     id uuid default gen_random_uuid() primary key,
     email text not null unique
   );

   create table inquiries (                 -- заявки с формы контактов
     id uuid default gen_random_uuid() primary key,
     name text not null,
     email text not null,
     type text,
     message text,
     created_at timestamptz default now()
   );

   -- RLS: чтение всем, запись — только админам
   alter table categories enable row level security;
   alter table projects   enable row level security;
   alter table photos     enable row level security;
   alter table admins     enable row level security;
   alter table inquiries  enable row level security;

   create policy "public read"   on categories for select using (true);
   create policy "public read"   on projects   for select using (true);
   create policy "public read"   on photos     for select using (true);
   create policy "public read"   on admins     for select using (true);
   create policy "public insert" on inquiries  for insert with check (true);

   create policy "admin all" on categories for all to authenticated
     using (is_admin()) with check (is_admin());
   create policy "admin all" on projects   for all to authenticated
     using (is_admin()) with check (is_admin());
   create policy "admin all" on photos     for all to authenticated
     using (is_admin()) with check (is_admin());
   create policy "admin all" on admins     for all to authenticated
     using (is_admin()) with check (is_admin());
   ```

4. **Storage** — публичный бакет для кадров и политики для админов:

   ```sql
   insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

   create policy "photos public read"  on storage.objects for select
     using (bucket_id = 'photos');
   create policy "photos admin write"  on storage.objects for insert to authenticated
     with check (bucket_id = 'photos' and is_admin());
   create policy "photos admin update" on storage.objects for update to authenticated
     using (bucket_id = 'photos' and is_admin());
   create policy "photos admin delete" on storage.objects for delete to authenticated
     using (bucket_id = 'photos' and is_admin());
   ```

5. **Первый администратор** (в таблице `admins`): создайте пользователя в
   Supabase → Authentication → Users, затем добавьте его email:

   ```sql
   insert into admins (email) values ('you@example.com');
   ```

   > Пока `admins` пуста, пройти `is_admin()` не может никто — первый email
   > всегда добавляется вручную из SQL Editor (service role обходит RLS).

6. Пересоберите проект (`npm run build`) — ключи подставляются на этапе сборки.

---

## Демо-режим (без Supabase)

- Данные: локальный датасет `src/lib/api.ts` — 5 проектов, 10 кадров с настоящим EXIF.
- Админка: сессия хранится в `localStorage`, изменения живут до перезагрузки страницы.
- Загрузки: миниатюра кадра сохраняется в `localStorage` и отображается на «Сводке».
- Заявки с формы: имитация отправки с задержкой.

Переключение между режимами видно в сайдбаре админки:
«Supabase · подключён» / «Демо-режим».

---

## Маршруты

### Публичная витрина

| Путь | Страница |
| --- | --- |
| `/#/` | Главная: hero-кадр с Ken Burns, избранные проекты, призыв к действию |
| `/#/portfolio` | Портфолио: sticky-фильтры по жанрам, masonry-сетка (CSS columns), лайтбокс с EXIF |
| `/#/portfolio/:slug` | Проект: sticky-описание с EXIF-бейджами, вертикальная галерея, переходы между проектами |
| `/#/about` | Манифест, биография со статистикой, выставки и пресса |
| `/#/contact` | Услуги с ценами + форма заявки |

### Админ-панель (защищена middleware)

| Путь | Страница |
| --- | --- |
| `/#/admin/login` | Вход (Supabase Auth или демо) |
| `/#/admin` | Сводка: счётчики, распределение по жанрам, последние загрузки |
| `/#/admin/upload` | Загрузка кадра: drag-and-drop, EXIF, выбор проекта; файл → Storage, строка → `photos` |
| `/#/admin/projects` | CRUD проектов: создание, slug с транслитерацией, редактирование, удаление |
| `/#/admin/manage` | Архив: вкладки «Кадры/Проекты», поиск, «Изменить/Удалить», подтверждение, «Показать ещё» |

---

## Оптимизация

- **Code splitting**: все админ-маршруты — `React.lazy`, Supabase SDK грузится
  динамически только при обращении к данным. Главный чанк ≈ 242 КБ (76 КБ gzip).
- **Изображения**: компонент `Photo` (`src/components/Photo.tsx`) — аналог
  `next/image`: `priority`, ленивая загрузка, blur-up placeholder,
  фиксация `aspect-ratio` (нулевой CLS), адаптивные `sizes`.
- **Метаданные**: `usePageMeta` (`src/lib/meta.ts`) обновляет `<title>`,
  `description`, OpenGraph и Twitter-карточки на каждом маршруте; страницы
  проектов берут метаданные из данных (включая OG-обложку).
- **Безопасность форм**: honeypot-ловушка и лимиты длины в форме контактов;
  локаут после 5 неудачных попыток и нераскрывающие ошибки на входе в админку;
  периметр — RLS-политики и rate-limit Supabase Auth.
- **Доступность**: все анимации отключаются при `prefers-reduced-motion`,
  лайтбокс и модалки управляются с клавиатуры, `aria`-атрибуты по смыслу.

---

## Структура проекта

```
src/
├── app/                    # «App Router»: layout и страницы
│   ├── layout.tsx          # Navbar + main + Footer + зерно
│   ├── page.tsx            # Главная
│   └── admin/              # Админ-панель «Тёмная комната»
│       ├── layout.tsx      # Защищённый каркас с сайдбаром
│       ├── login/page.tsx
│       ├── dashboard/page.tsx
│       ├── upload/page.tsx
│       ├── projects/page.tsx
│       └── manage/page.tsx
├── pages/                  # Публичные страницы
│   ├── PortfolioPage.tsx
│   ├── ProjectPage.tsx     # /portfolio/[slug]
│   ├── AboutPage.tsx
│   └── ContactPage.tsx
├── components/             # Hero, Navbar, Footer, галерея, лайтбокс,
│   │                       # формы, ConfirmDialog, кастомные SVG-иконки…
│   └── Photo.tsx           # Аналог next/image (priority/sizes/blur-up)
├── lib/
│   ├── api.ts              # Слой данных: Supabase + фолбэк на демо-датасет
│   ├── meta.ts             # Метаданные (аналог generateMetadata)
│   ├── motion.tsx          # Reveal, scramble, count-up, prefers-reduced-motion
│   ├── format.ts           # Русская плюрализация («1 кадр, 2 кадра, 5 кадров»)
│   └── supabase/           # browser.ts (ленивый клиент), server.ts (@supabase/ssr), auth.ts
├── data/                   # Локальные датасеты (жанры, кадры, избранное)
├── middleware.tsx          # Защита /admin/* (RequireAuth) + код серверного middleware
└── index.css               # Tailwind 4-токены, keyframes, reveal-система, зерно
```

---

## Примечания

- Фотографии в демо-датасете сгенерированы нейросетью и используются как
  заглушки; замените URL в `src/lib/api.ts` и `src/data/projects.ts`
  (или загрузите свои кадры через админку при подключённом Supabase).
- Английский в интерфейсе сохранён только как профессиональная нотация:
  EXIF (`ƒ/2.0`, `1/250`, `ISO 100`), бренды техники и сервисов.
