/**
 * Локальный бэкенд портфолио (всё на одноплатнике, без внешних сервисов).
 *
 *  - SQLite (better-sqlite3): categories, projects, photos, admins, inquiries
 *  - Аутентификация админки: bcrypt-хэш + JWT (7 дней), токен в заголовке
 *  - Загрузка фото: multer → DATA_DIR/uploads, отдача через /uploads
 *  - Защита: публично только чтение и заявки; всё остальное — requireAdmin
 *  - Rate limit: логин (5 попыток / 30 с локаут), заявки (3/мин с IP)
 *
 * Переменные окружения:
 *  PORT             — порт API (по умолчанию 3000)
 *  DATA_DIR         — папка данных: БД, загрузки, секрет JWT (в контейнере /data)
 *  ADMIN_EMAIL      — email первого администратора
 *  ADMIN_PASSWORD   — пароль первого администратора (иначе генерируется и печатается в лог)
 *  JWT_SECRET       — необязательно; без него секрет хранится в DATA_DIR/.jwt_secret
 */
const express = require("express");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* ── База данных ──────────────────────────────────────────────────────── */
const db = new Database(path.join(DATA_DIR, "portfolio.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  create table if not exists categories (
    id text primary key,
    name text not null unique,
    slug text not null unique
  );
  create table if not exists projects (
    id text primary key,
    title text not null,
    slug text unique,
    description text,
    location text,
    date text,
    category_id text references categories(id),
    cover_image_url text,
    created_at text default (datetime('now','localtime'))
  );
  create table if not exists photos (
    id text primary key,
    project_id text not null references projects(id) on delete cascade,
    image_url text not null,
    width integer,
    height integer,
    exif_camera text,
    exif_lens text,
    exif_settings text,
    sort_order integer default 0,
    created_at text default (datetime('now','localtime'))
  );
  create table if not exists admins (
    id text primary key,
    email text not null unique,
    password_hash text not null
  );
  create table if not exists inquiries (
    id text primary key,
    name text not null,
    email text not null,
    type text,
    message text not null,
    created_at text default (datetime('now','localtime'))
  );
`);

const uid = () => crypto.randomUUID();

/* Стартовое наполнение: категории + первый администратор */
const CATS = [
  ["Улица", "street"],
  ["Портрет", "portraits"],
  ["Архитектура", "architecture"],
  ["Натюрморт", "still-life"],
  ["Пейзаж", "landscapes"],
  ["Чёрно-белое", "bw"],
];
const insCat = db.prepare("insert or ignore into categories (id, name, slug) values (?, ?, ?)");
for (const [name, slug] of CATS) insCat.run(uid(), name, slug);

if (db.prepare("select count(*) as c from admins").get().c === 0) {
  const email = (process.env.ADMIN_EMAIL || "admin@localhost").toLowerCase();
  const pass = process.env.ADMIN_PASSWORD || crypto.randomBytes(6).toString("base64url");
  db.prepare("insert into admins (id, email, password_hash) values (?, ?, ?)").run(
    uid(),
    email,
    bcrypt.hashSync(pass, 10),
  );
  console.log("======================================================");
  console.log(" ПЕРВЫЙ ВХОД В АДМИН-ПАНЕЛЬ");
  console.log(`   Email:  ${email}`);
  console.log(`   Пароль: ${pass}`);
  console.log(" (свой пароль задайте через ADMIN_EMAIL/ADMIN_PASSWORD)");
  console.log("======================================================");
}

/* ── JWT-секрет (стабилен между рестартами) ───────────────────────────── */
let SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  const secretFile = path.join(DATA_DIR, ".jwt_secret");
  if (fs.existsSync(secretFile)) {
    SECRET = fs.readFileSync(secretFile, "utf8");
  } else {
    SECRET = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(secretFile, SECRET, { mode: 0o600 });
  }
}
const signToken = (email) => jwt.sign({ email }, SECRET, { expiresIn: "7d" });

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  try {
    req.admin = jwt.verify(header.replace(/^Bearer\s+/i, ""), SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Требуется вход в админ-панель" });
  }
}

/* ── Простейшие rate-лимиты ───────────────────────────────────────────── */
const loginAttempts = new Map(); // ключ → { count, lockUntil }

function loginLockSeconds(key) {
  const rec = loginAttempts.get(key);
  if (!rec) return 0;
  if (rec.lockUntil > Date.now()) return Math.ceil((rec.lockUntil - Date.now()) / 1000);
  if (rec.lockUntil) loginAttempts.delete(key);
  return 0;
}
function registerLoginFail(key) {
  const rec = loginAttempts.get(key) || { count: 0, lockUntil: 0 };
  rec.count += 1;
  if (rec.count >= 5) {
    rec.lockUntil = Date.now() + 30_000;
    rec.count = 0;
  }
  loginAttempts.set(key, rec);
}

const inquiryHits = new Map(); // ip → [timestamps]
function inquiryAllowed(ip) {
  const now = Date.now();
  const hits = (inquiryHits.get(ip) || []).filter((t) => now - t < 60_000);
  if (hits.length >= 3) return false;
  hits.push(now);
  inquiryHits.set(ip, hits);
  return true;
}

/* ── Загрузка файлов ──────────────────────────────────────────────────── */
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 5);
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 МБ на кадр
  fileFilter: (_req, file, cb) => cb(null, ALLOWED_TYPES.has(file.mimetype)),
});

/* Удаление файла с диска, если он лежит в нашей папке загрузок */
function removeStoredFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_DIR, path.basename(imageUrl));
  fs.promises.unlink(file).catch(() => {});
}

/* ── Приложение ───────────────────────────────────────────────────────── */
const app = express();
app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));

/* CORS — только для локальной разработки (vite dev server) */
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* Файлы фото отдаёт сам сервер (в проде их ещё и кеширует nginx) */
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));

/* ── Публичное API ────────────────────────────────────────────────────── */
app.get("/api/portfolio", (_req, res) => {
  res.json({
    categories: db.prepare("select * from categories order by name").all(),
    projects: db.prepare("select * from projects order by date desc").all(),
    photos: db.prepare("select * from photos order by sort_order").all(),
  });
});

/* Заявки с формы контактов: анонимная вставка, 3 в минуту с одного IP */
app.post("/api/inquiries", (req, res) => {
  if (!inquiryAllowed(req.ip)) {
    return res.status(429).json({ error: "Слишком много заявок — попробуйте через минуту" });
  }
  const { name, email, type, message } = req.body || {};
  if (
    typeof name !== "string" || name.trim().length < 2 ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
    typeof message !== "string" || message.trim().length < 10
  ) {
    return res.status(400).json({ error: "Заявка заполнена не полностью" });
  }
  db.prepare("insert into inquiries (id, name, email, type, message) values (?, ?, ?, ?, ?)").run(
    uid(),
    name.trim().slice(0, 80),
    email.trim().toLowerCase().slice(0, 120),
    (type || "").slice(0, 40),
    message.trim().slice(0, 2000),
  );
  res.json({ ok: true });
});

/* ── Аутентификация ───────────────────────────────────────────────────── */
app.post("/api/admin/login", (req, res) => {
  const email = String((req.body || {}).email || "").trim().toLowerCase();
  const password = String((req.body || {}).password || "");
  const key = `${req.ip}:${email}`;

  const wait = loginLockSeconds(key);
  if (wait > 0) return res.status(429).json({ error: `Слишком много попыток — подождите ${wait} с` });

  const admin = db.prepare("select * from admins where email = ?").get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    registerLoginFail(key);
    /* Общее сообщение: не раскрываем, существует ли аккаунт */
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  loginAttempts.delete(key);
  res.json({ token: signToken(admin.email), email: admin.email });
});

app.get("/api/admin/session", requireAdmin, (req, res) => res.json({ email: req.admin.email }));

/* ── Админка: заявки ──────────────────────────────────────────────────── */
app.get("/api/admin/inquiries", requireAdmin, (_req, res) => {
  res.json(db.prepare("select * from inquiries order by created_at desc").all());
});
app.delete("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  db.prepare("delete from inquiries where id = ?").run(req.params.id);
  res.json({ ok: true });
});

/* ── Админка: проекты ─────────────────────────────────────────────────── */
app.post("/api/admin/projects", requireAdmin, (req, res) => {
  const { title, slug, description, location, date, category_id, cover_image_url } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: "Название обязательно" });
  const id = uid();
  db.prepare(
    `insert into projects (id, title, slug, description, location, date, category_id, cover_image_url)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, title.trim(), slug?.trim() || null, description || null, location || null, date || null, category_id || null, cover_image_url || null);
  res.json({ id });
});

app.patch("/api/admin/projects/:id", requireAdmin, (req, res) => {
  const fields = ["title", "slug", "description", "location", "date", "category_id", "cover_image_url"];
  const keys = Object.keys(req.body || {}).filter((k) => fields.includes(k));
  if (!keys.length) return res.json({ ok: true });
  const set = keys.map((k) => `${k} = ?`).join(", ");
  db.prepare(`update projects set ${set} where id = ?`).run(...keys.map((k) => req.body[k]), req.params.id);
  res.json({ ok: true });
});

/* Удаление проекта: файлы всех его кадров → сами кадры → проект */
app.delete("/api/admin/projects/:id", requireAdmin, (req, res) => {
  const photos = db.prepare("select image_url from photos where project_id = ?").all(req.params.id);
  photos.forEach((p) => removeStoredFile(p.image_url));
  db.prepare("delete from photos where project_id = ?").run(req.params.id);
  db.prepare("delete from projects where id = ?").run(req.params.id);
  res.json({ ok: true });
});

/* ── Админка: кадры ───────────────────────────────────────────────────── */
app.post("/api/admin/photos", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Файл не получен (jpeg/png/webp/gif/avif, до 100 МБ)" });
  const { project_id, exif_camera, exif_lens, exif_settings, width, height } = req.body || {};
  if (!project_id) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ error: "Укажите проект" });
  }
  const project = db.prepare("select id from projects where id = ?").get(project_id);
  if (!project) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(404).json({ error: "Проект не найден" });
  }
  const maxOrder = db.prepare("select coalesce(max(sort_order), -1) as m from photos").get().m;
  const id = uid();
  const imageUrl = `/uploads/${req.file.filename}`;
  db.prepare(
    `insert into photos (id, project_id, image_url, width, height, exif_camera, exif_lens, exif_settings, sort_order)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    project_id,
    imageUrl,
    Number(width) || null,
    Number(height) || null,
    exif_camera || null,
    exif_lens || null,
    exif_settings || null,
    maxOrder + 1,
  );
  res.json({ id, image_url: imageUrl });
});

app.patch("/api/admin/photos/:id", requireAdmin, (req, res) => {
  const fields = ["project_id", "sort_order", "exif_camera", "exif_lens", "exif_settings"];
  const keys = Object.keys(req.body || {}).filter((k) => fields.includes(k));
  if (!keys.length) return res.json({ ok: true });
  const set = keys.map((k) => `${k} = ?`).join(", ");
  db.prepare(`update photos set ${set} where id = ?`).run(...keys.map((k) => req.body[k]), req.params.id);
  res.json({ ok: true });
});

app.delete("/api/admin/photos/:id", requireAdmin, (req, res) => {
  const photo = db.prepare("select image_url from photos where id = ?").get(req.params.id);
  if (photo) removeStoredFile(photo.image_url);
  db.prepare("delete from photos where id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`portfolio-server слушает :${PORT}, данные в ${DATA_DIR}`);
});
