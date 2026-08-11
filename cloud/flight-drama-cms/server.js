/**
 * Flight Drama CMS — Backend Server
 * ===================================
 * Standalone Express API running on the persistent cloud computer.
 * Connects directly to the Flight Drama TiDB database.
 * Custom email/password auth (no Manus OAuth).
 * Port: 3001
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.CMS_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fd-cms-secret';

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Serve frontend
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
app.use(express.static(publicDir));

// ── Database ───────────────────────────────────────────────────────────────
let db = null;
async function getDb() {
  if (!db) {
    try {
      db = await mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
      });
      console.log('[DB] Connected to Flight Drama database');
    } catch (e) {
      console.error('[DB] Connection failed:', e.message);
    }
  }
  return db;
}

// ── CMS Users Table (separate from main site users) ───────────────────────
async function ensureCmsUsersTable() {
  const pool = await getDb();
  if (!pool) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cms_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('admin','editor') DEFAULT 'editor',
      lastLogin TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Create default admin if no users exist
  const [rows] = await pool.execute('SELECT COUNT(*) as count FROM cms_users');
  if (rows[0].count === 0) {
    const hash = await bcrypt.hash('FlightDrama2026!', 12);
    await pool.execute(
      'INSERT INTO cms_users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)',
      ['josh@flightdrama.com', hash, 'Josh', 'admin']
    );
    console.log('[CMS] Default admin created: josh@flightdrama.com / FlightDrama2026!');
  }
}

// ── Auth Middleware ────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Image Upload ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth Routes ────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const pool = await getDb();
  if (!pool) return res.status(500).json({ error: 'Database unavailable' });
  
  const [rows] = await pool.execute('SELECT * FROM cms_users WHERE email = ? LIMIT 1', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
  
  const user = rows[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  
  await pool.execute('UPDATE cms_users SET lastLogin = NOW() WHERE id = ?', [user.id]);
  
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => res.json(req.user));

app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  const pool = await getDb();
  const [rows] = await pool.execute('SELECT * FROM cms_users WHERE id = ? LIMIT 1', [req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, rows[0].passwordHash);
  if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
  const hash = await bcrypt.hash(newPassword, 12);
  await pool.execute('UPDATE cms_users SET passwordHash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ success: true });
});

// ── Categories ─────────────────────────────────────────────────────────────
app.get('/api/categories', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name ASC');
  res.json(rows);
});

// ── Authors ────────────────────────────────────────────────────────────────
app.get('/api/authors', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const [rows] = await pool.execute('SELECT * FROM authors ORDER BY name ASC');
  res.json(rows);
});

// ── Articles ───────────────────────────────────────────────────────────────
app.get('/api/articles', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const { search, categoryId, status, limit = 50, offset = 0 } = req.query;
  
  let where = '1=1';
  const params = [];
  
  if (search) { where += ' AND a.title LIKE ?'; params.push(`%${search}%`); }
  if (categoryId) { where += ' AND a.categoryId = ?'; params.push(Number(categoryId)); }
  
  const [rows] = await pool.execute(
    `SELECT a.id, a.title, a.slug, a.excerpt, a.featuredImage, a.postType, a.views, 
            a.isFeatured, a.isBreaking, a.isPro, a.publishedAt, a.createdAt,
            c.name as categoryName, c.slug as categorySlug,
            au.name as authorName
     FROM articles a
     LEFT JOIN categories c ON a.categoryId = c.id
     LEFT JOIN authors au ON a.authorId = au.id
     WHERE ${where}
     ORDER BY a.publishedAt DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) as total FROM articles a WHERE ${where}`,
    params
  );
  
  res.json({ articles: rows, total: countRows[0].total });
});

app.get('/api/articles/:id', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const [rows] = await pool.execute(
    `SELECT a.*, c.name as categoryName, au.name as authorName
     FROM articles a
     LEFT JOIN categories c ON a.categoryId = c.id
     LEFT JOIN authors au ON a.authorId = au.id
     WHERE a.id = ? LIMIT 1`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Article not found' });
  res.json(rows[0]);
});

app.post('/api/articles', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const {
    title, slug, excerpt, content, categoryId, authorId,
    featuredImage, videoUrl, tags, isBreaking, isFeatured, isPro, publishedAt
  } = req.body;
  
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }
  
  // Check slug uniqueness
  const [existing] = await pool.execute('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
  if (existing.length) return res.status(400).json({ error: 'Slug already exists' });
  
  const [result] = await pool.execute(
    `INSERT INTO articles (title, slug, excerpt, content, categoryId, authorId, featuredImage, videoUrl, 
      tags, isBreaking, isFeatured, isPro, postType, views, publishedAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'article', 0, ?, NOW(), NOW())`,
    [
      title, slug, excerpt || null, content,
      categoryId || null, authorId || null,
      featuredImage || null, videoUrl || null,
      tags ? JSON.stringify(tags) : null,
      isBreaking ? 1 : 0, isFeatured ? 1 : 0, isPro ? 1 : 0,
      publishedAt || new Date().toISOString().slice(0, 19).replace('T', ' ')
    ]
  );
  
  res.json({ success: true, id: result.insertId });
});

app.put('/api/articles/:id', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const {
    title, slug, excerpt, content, categoryId, authorId,
    featuredImage, videoUrl, tags, isBreaking, isFeatured, isPro, publishedAt
  } = req.body;
  
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }
  
  // Check slug uniqueness (excluding current article)
  const [existing] = await pool.execute('SELECT id FROM articles WHERE slug = ? AND id != ? LIMIT 1', [slug, req.params.id]);
  if (existing.length) return res.status(400).json({ error: 'Slug already exists' });
  
  await pool.execute(
    `UPDATE articles SET title=?, slug=?, excerpt=?, content=?, categoryId=?, authorId=?,
      featuredImage=?, videoUrl=?, tags=?, isBreaking=?, isFeatured=?, isPro=?,
      publishedAt=?, updatedAt=NOW()
     WHERE id=?`,
    [
      title, slug, excerpt || null, content,
      categoryId || null, authorId || null,
      featuredImage || null, videoUrl || null,
      tags ? JSON.stringify(tags) : null,
      isBreaking ? 1 : 0, isFeatured ? 1 : 0, isPro ? 1 : 0,
      publishedAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
      req.params.id
    ]
  );
  
  res.json({ success: true });
});

app.delete('/api/articles/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const pool = await getDb();
  await pool.execute('DELETE FROM articles WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── Image Upload ───────────────────────────────────────────────────────────
app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `http://34.52.212.6:3001/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

// ── Stats ──────────────────────────────────────────────────────────────────
app.get('/api/stats', authMiddleware, async (req, res) => {
  const pool = await getDb();
  const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM articles');
  const [[{ totalViews }]] = await pool.execute('SELECT SUM(views) as totalViews FROM articles');
  const [[{ subscribers }]] = await pool.execute('SELECT COUNT(*) as subscribers FROM newsletter_subscribers WHERE status = "active"');
  const [[{ comments }]] = await pool.execute('SELECT COUNT(*) as comments FROM article_comments WHERE status = "approved"');
  const [recent] = await pool.execute('SELECT id, title, views, publishedAt FROM articles ORDER BY publishedAt DESC LIMIT 5');
  res.json({ total, totalViews: totalViews || 0, subscribers, comments, recent });
});

// ── CMS Users Management (admin only) ─────────────────────────────────────
app.get('/api/cms-users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const pool = await getDb();
  const [rows] = await pool.execute('SELECT id, email, name, role, lastLogin, createdAt FROM cms_users ORDER BY createdAt DESC');
  res.json(rows);
});

app.post('/api/cms-users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' });
  const pool = await getDb();
  const hash = await bcrypt.hash(password, 12);
  await pool.execute('INSERT INTO cms_users (email, passwordHash, name, role) VALUES (?, ?, ?, ?)', [email, hash, name, role || 'editor']);
  res.json({ success: true });
});

app.delete('/api/cms-users/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });
  const pool = await getDb();
  await pool.execute('DELETE FROM cms_users WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── Slug Generator ─────────────────────────────────────────────────────────
app.post('/api/generate-slug', authMiddleware, async (req, res) => {
  const { title } = req.body;
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const pool = await getDb();
  const [existing] = await pool.execute('SELECT slug FROM articles WHERE slug LIKE ? LIMIT 10', [`${base}%`]);
  const slugs = existing.map(r => r.slug);
  let slug = base;
  let i = 2;
  while (slugs.includes(slug)) { slug = `${base}-${i++}`; }
  res.json({ slug });
});

// ── SPA fallback ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('CMS frontend not found');
  }
});

// ── Start ──────────────────────────────────────────────────────────────────
(async () => {
  await ensureCmsUsersTable();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✈ Flight Drama CMS running on port ${PORT}`);
    console.log(`   URL: http://34.52.212.6:${PORT}`);
    console.log(`   Default login: josh@flightdrama.com / FlightDrama2026!\n`);
  });
})();
