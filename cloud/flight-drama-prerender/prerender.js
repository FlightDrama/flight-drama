/**
 * Flight Drama Prerender Proxy v2
 * 
 * Serves full HTML + comprehensive JSON-LD schema to search engine crawlers.
 * Regular browser users are proxied transparently to flightdrama.com.
 * 
 * Schema included:
 *   - NewsArticle (comprehensive: wordCount, articleBody, thumbnailUrl, speakable, inLanguage, etc.)
 *   - BreadcrumbList (Home → Category → Article)
 *   - WebSite (with SearchAction for sitelinks searchbox)
 *   - Organization (with sameAs social links)
 * 
 * Sitemap: Google News sitemap format with <news:news> tags
 * Port: 8084
 */

const http = require('http');
const https = require('https');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/home/ubuntu/flight-drama-prerender/.env' });

const PORT = 8084;
const TARGET_HOST = 'flightdrama.com';
const SITE_URL = 'https://flightdrama.com';
const LOGO_URL = `${SITE_URL}/manus-storage/FlightDrama_ca641ff4.jpg`;
const LOGO_WIDTH = 512;
const LOGO_HEIGHT = 512;

// Bot user agents that need prerendering
const BOT_PATTERNS = [
  'googlebot', 'google-inspectiontool', 'bingbot', 'slurp', 'duckduckbot',
  'baiduspider', 'yandexbot', 'sogou', 'exabot', 'facebot', 'ia_archiver',
  'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot',
  'facebookexternalhit', 'applebot', 'semrushbot', 'ahrefsbot',
  'mj12bot', 'dotbot', 'rogerbot', 'screaming frog', 'googleother',
  'storebot-google', 'google-read-aloud',
];

function isBot(userAgent = '') {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(bot => ua.includes(bot));
}

let db = null;
async function getDb() {
  if (!db) {
    db = await mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return db;
}

async function getArticleBySlug(slug) {
  try {
    const pool = await getDb();
    const [rows] = await pool.execute(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.content, a.featuredImage,
              a.publishedAt, a.updatedAt, a.metaTitle, a.metaDescription,
              a.tags, a.imageAttribution,
              au.name as authorName, au.bio as authorBio,
              c.name as categoryName, c.slug as categorySlug
       FROM articles a
       LEFT JOIN authors au ON a.authorId = au.id
       LEFT JOIN categories c ON a.categoryId = c.id
       WHERE a.slug = ? AND a.status = 'published'
       LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  } catch (e) {
    console.error('[Prerender] DB error:', e.message);
    return null;
  }
}

async function getRelatedArticles(categoryId, excludeSlug, limit = 5) {
  try {
    const pool = await getDb();
    const [rows] = await pool.execute(
      `SELECT title, slug FROM articles
       WHERE status = 'published' AND categoryId = ? AND slug != ?
       ORDER BY publishedAt DESC LIMIT ?`,
      [categoryId, excludeSlug, limit]
    );
    return rows;
  } catch { return []; }
}

async function getAllArticles() {
  try {
    const pool = await getDb();
    const [rows] = await pool.execute(
      `SELECT a.slug, a.title, a.publishedAt, a.updatedAt, c.name as categoryName
       FROM articles a
       LEFT JOIN categories c ON a.categoryId = c.id
       WHERE a.status = 'published'
       ORDER BY a.publishedAt DESC`
    );
    return rows;
  } catch (e) { return []; }
}

async function getAllCategories() {
  try {
    const pool = await getDb();
    const [rows] = await pool.execute(`SELECT slug, name FROM categories`);
    return rows;
  } catch (e) { return []; }
}

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJson(str = '') {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

function countWords(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function renderArticlePage(slug) {
  const article = await getArticleBySlug(slug);
  if (!article) return null;

  const title = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt || '';
  const image = article.featuredImage
    ? (article.featuredImage.startsWith('http') ? article.featuredImage : `${SITE_URL}${article.featuredImage}`)
    : LOGO_URL;
  const url = `${SITE_URL}/article/${article.slug}`;
  const publishedAt = new Date(article.publishedAt).toISOString();
  const updatedAt = new Date(article.updatedAt || article.publishedAt).toISOString();
  const plainText = stripHtml(article.content || '');
  const articleBodySnippet = plainText.slice(0, 500);
  const wordCount = countWords(plainText);
  const tags = (() => { try { return JSON.parse(article.tags || '[]'); } catch { return []; } })();
  const authorName = article.authorName || 'Flight Drama Autopilot';
  const categoryName = article.categoryName || 'Aviation News';
  const categorySlug = article.categorySlug || 'aviation-news';
  const year = new Date(article.publishedAt).getFullYear();

  // ── JSON-LD schemas ──────────────────────────────────────────────────────

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    "headline": article.title,
    "name": article.title,
    "description": description,
    "abstract": description,
    "articleBody": articleBodySnippet,
    "wordCount": wordCount,
    "image": {
      "@type": "ImageObject",
      "url": image,
      "width": 1280,
      "height": 720
    },
    "thumbnailUrl": image,
    "datePublished": publishedAt,
    "dateModified": updatedAt,
    "dateCreated": publishedAt,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": `${SITE_URL}/author/${authorName.toLowerCase().replace(/\s+/g, '-')}`,
      "worksFor": {
        "@type": "Organization",
        "name": "Flight Drama",
        "url": SITE_URL
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "Flight Drama",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
        "width": LOGO_WIDTH,
        "height": LOGO_HEIGHT
      },
      "sameAs": [
        "https://twitter.com/flightdrama",
        "https://www.instagram.com/flightdrama",
        "https://www.tiktok.com/@flightdrama",
        "https://www.facebook.com/flightdrama"
      ]
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "url": url,
    "articleSection": categoryName,
    "keywords": tags.length > 0 ? tags.join(', ') : `${categoryName}, aviation news, flight drama`,
    "inLanguage": "en-GB",
    "copyrightYear": year,
    "copyrightHolder": {
      "@type": "Organization",
      "name": "Flight Drama",
      "url": SITE_URL
    },
    "isAccessibleForFree": true,
    "isPartOf": {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Flight Drama",
      "url": SITE_URL
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".article-excerpt", ".article-body p:first-of-type"]
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": SITE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `${SITE_URL}/category/${categorySlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": url
      }
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "name": "Flight Drama",
    "url": SITE_URL,
    "description": "The internet's home for aviation enthusiasts. Breaking aviation news, incident analysis, community forum, and more.",
    "inLanguage": "en-GB",
    "publisher": {
      "@type": "Organization",
      "name": "Flight Drama",
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": LOGO_URL,
        "width": LOGO_WIDTH,
        "height": LOGO_HEIGHT
      },
      "sameAs": [
        "https://twitter.com/flightdrama",
        "https://www.instagram.com/flightdrama",
        "https://www.tiktok.com/@flightdrama",
        "https://www.facebook.com/flightdrama"
      ]
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/news?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const schemasJson = [newsArticleSchema, breadcrumbSchema, webSiteSchema]
    .map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n  ');

  // ── Meta tags ────────────────────────────────────────────────────────────

  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
  const twitterSite = '@flightdrama';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Flight Drama</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <link rel="canonical" href="${url}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="720">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Flight Drama">
  <meta property="og:locale" content="en_GB">
  <meta property="article:published_time" content="${publishedAt}">
  <meta property="article:modified_time" content="${updatedAt}">
  <meta property="article:author" content="${escapeHtml(authorName)}">
  <meta property="article:section" content="${escapeHtml(categoryName)}">
  ${tags.map(t => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n  ')}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${twitterSite}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(title)}">

  <!-- Additional SEO -->
  <meta name="author" content="${escapeHtml(authorName)}">
  <meta name="keywords" content="${escapeHtml(tags.length > 0 ? tags.join(', ') : `${categoryName}, aviation news, flight drama`)}">
  <meta name="news_keywords" content="${escapeHtml(tags.slice(0, 10).join(', '))}">
  <meta name="article:reading_time" content="${readingTimeMinutes}">
  <link rel="sitemap" type="application/xml" href="${SITE_URL}/sitemap.xml">
  <link rel="alternate" type="application/rss+xml" title="Flight Drama" href="${SITE_URL}/feed.xml">

  <!-- JSON-LD Schemas -->
  ${schemasJson}
</head>
<body>
  <header>
    <nav aria-label="Site navigation">
      <a href="${SITE_URL}">Flight Drama — Aviation News</a>
    </nav>
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="${SITE_URL}">Home</a></li>
        <li><a href="${SITE_URL}/category/${escapeHtml(categorySlug)}">${escapeHtml(categoryName)}</a></li>
        <li aria-current="page">${escapeHtml(article.title)}</li>
      </ol>
    </nav>
  </header>
  <main>
    <article itemscope itemtype="https://schema.org/NewsArticle">
      <meta itemprop="datePublished" content="${publishedAt}">
      <meta itemprop="dateModified" content="${updatedAt}">
      <h1 itemprop="headline">${escapeHtml(article.title)}</h1>
      <div class="article-meta">
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          By <span itemprop="name">${escapeHtml(authorName)}</span>
        </span>
        | <time datetime="${publishedAt}">${new Date(article.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>
        | <a href="${SITE_URL}/category/${escapeHtml(categorySlug)}" itemprop="articleSection">${escapeHtml(categoryName)}</a>
        | ${readingTimeMinutes} min read
        | ${wordCount.toLocaleString()} words
      </div>
      ${article.featuredImage ? `<figure>
        <img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" itemprop="image" style="max-width:100%;height:auto" width="1280" height="720">
        ${article.imageAttribution ? `<figcaption>${escapeHtml(article.imageAttribution)}</figcaption>` : ''}
      </figure>` : ''}
      <p class="article-excerpt" itemprop="description">${escapeHtml(description)}</p>
      <div class="article-body" itemprop="articleBody">${article.content}</div>
      ${tags.length > 0 ? `<div class="article-tags">
        <strong>Tags:</strong>
        ${tags.map(t => `<a href="${SITE_URL}/tag/${encodeURIComponent(t.toLowerCase().replace(/\s+/g, '-'))}" rel="tag">${escapeHtml(t)}</a>`).join(', ')}
      </div>` : ''}
    </article>
    <nav aria-label="Category navigation">
      <a href="${SITE_URL}">← Back to Flight Drama</a>
      ${article.categorySlug ? ` | <a href="${SITE_URL}/category/${article.categorySlug}">More ${escapeHtml(categoryName)} articles</a>` : ''}
    </nav>
  </main>
  <footer>
    <p>© ${year} Flight Drama — Aviation News | <a href="${SITE_URL}/sitemap.xml">Sitemap</a></p>
  </footer>
</body>
</html>`;
}

async function getCategoryArticles(slug) {
  try {
    const pool = await getDb();
    const [rows] = await pool.execute(
      `SELECT a.title, a.slug, a.excerpt, a.featuredImage, a.publishedAt
       FROM articles a
       JOIN categories c ON a.categoryId = c.id
       WHERE c.slug = ? AND a.status = 'published'
       ORDER BY a.publishedAt DESC LIMIT 30`,
      [slug]
    );
    const [catRows] = await pool.execute('SELECT name, slug FROM categories WHERE slug = ? LIMIT 1', [slug]);
    return { articles: rows, category: catRows[0] || null };
  } catch (e) { return { articles: [], category: null }; }
}

async function getTagArticles(slug) {
  try {
    const pool = await getDb();
    // Tags stored as JSON array in articles.tags column
    const tagName = slug.replace(/-/g, ' ');
    const [rows] = await pool.execute(
      `SELECT title, slug, excerpt, featuredImage, publishedAt FROM articles
       WHERE status = 'published' AND (tags LIKE ? OR tags LIKE ? OR tags LIKE ?)
       ORDER BY publishedAt DESC LIMIT 30`,
      [`%"${tagName}"%`, `%${tagName}%`, `%${slug}%`]
    );
    return rows;
  } catch (e) { return []; }
}

async function renderCategoryPage(slug) {
  const { articles, category } = await getCategoryArticles(slug);
  if (!category && articles.length === 0) return null;

  const catName = category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const url = `${SITE_URL}/category/${slug}`;
  const title = `${catName} — Flight Drama`;
  const description = `Latest ${catName} news and updates from Flight Drama — aviation news for enthusiasts.`;

  const collectionSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': `${catName} — Flight Drama`,
    'description': description,
    'url': url,
    'publisher': { '@type': 'Organization', 'name': 'Flight Drama', 'url': SITE_URL },
    'breadcrumb': {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL },
        { '@type': 'ListItem', 'position': 2, 'name': catName, 'item': url }
      ]
    }
  });

  const articleList = articles.map(a => {
    const aUrl = `${SITE_URL}/article/${a.slug}`;
    const aTitle = escapeHtml(a.title);
    const aExcerpt = escapeHtml((a.excerpt || '').slice(0, 120));
    const aDate = new Date(a.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return `<article><h2><a href="${aUrl}">${aTitle}</a></h2><time>${aDate}</time><p>${aExcerpt}</p></article>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="Flight Drama">
  <script type="application/ld+json">${collectionSchema}</script>
</head>
<body>
  <header><a href="${SITE_URL}">Flight Drama — Aviation News</a></header>
  <main>
    <h1>${escapeHtml(catName)}</h1>
    <p>${escapeHtml(description)}</p>
    <section>${articleList}</section>
  </main>
  <footer><p>© Flight Drama — Aviation News | <a href="${SITE_URL}/sitemap.xml">Sitemap</a></p></footer>
</body>
</html>`;
}

async function renderTagPage(slug) {
  const articles = await getTagArticles(slug);
  if (articles.length === 0) return null;

  const tagName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const url = `${SITE_URL}/tag/${slug}`;
  const title = `${tagName} — Flight Drama`;
  const description = `Aviation news tagged with ${tagName} — Flight Drama.`;

  const articleList = articles.map(a => {
    const aUrl = `${SITE_URL}/article/${a.slug}`;
    const aTitle = escapeHtml(a.title);
    const aExcerpt = escapeHtml((a.excerpt || '').slice(0, 120));
    return `<article><h2><a href="${aUrl}">${aTitle}</a></h2><p>${aExcerpt}</p></article>`;
  }).join('\n');

  const tagSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': title,
    'description': description,
    'url': url,
    'publisher': { '@type': 'Organization', 'name': 'Flight Drama', 'url': SITE_URL }
  });

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${articles.length >= 5 ? 'index, follow' : 'noindex, follow'}">
  <link rel="canonical" href="${url}">
  <script type="application/ld+json">${tagSchema}</script>
</head>
<body>
  <header><a href="${SITE_URL}">Flight Drama — Aviation News</a></header>
  <main>
    <h1>${escapeHtml(tagName)}</h1>
    <p>${escapeHtml(description)}</p>
    <section>${articleList}</section>
  </main>
  <footer><p>© Flight Drama — Aviation News | <a href="${SITE_URL}/sitemap.xml">Sitemap</a></p></footer>
</body>
</html>`;
}

async function renderSitemap() {
  const articles = await getAllArticles();
  const categories = await getAllCategories();

  const staticPages = [
    { url: SITE_URL, priority: '1.0', changefreq: 'daily' },
    { url: `${SITE_URL}/news`, priority: '0.9', changefreq: 'daily' },
    { url: `${SITE_URL}/videos`, priority: '0.8', changefreq: 'weekly' },
    { url: `${SITE_URL}/forum`, priority: '0.7', changefreq: 'daily' },
    { url: `${SITE_URL}/newsletter`, priority: '0.6', changefreq: 'monthly' },
    { url: `${SITE_URL}/pro`, priority: '0.7', changefreq: 'monthly' },
    { url: `${SITE_URL}/flight-lookup`, priority: '0.8', changefreq: 'daily' },
    { url: `${SITE_URL}/on-this-day`, priority: '0.7', changefreq: 'daily' },
    { url: `${SITE_URL}/tags`, priority: '0.6', changefreq: 'weekly' },
  ];

  const categoryUrls = categories.map(c => ({
    url: `${SITE_URL}/category/${c.slug}`,
    priority: '0.7',
    changefreq: 'daily'
  }));

  // Google News sitemap: include <news:news> for articles published in last 2 days
  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
  const articleUrls = articles.map(a => {
    const pubDate = new Date(a.publishedAt);
    const isRecent = pubDate.getTime() > twoDaysAgo;
    const lastmod = new Date(a.updatedAt || a.publishedAt).toISOString().split('T')[0];
    return {
      url: `${SITE_URL}/article/${a.slug}`,
      lastmod,
      priority: '0.9',
      changefreq: 'weekly',
      newsTitle: a.title,
      newsDate: pubDate.toISOString(),
      newsCategory: a.categoryName || 'Aviation News',
      isRecent,
    };
  });

  const allUrls = [...staticPages, ...categoryUrls, ...articleUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map(u => `  <url>
    <loc>${u.url}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    ${u.isRecent && u.newsTitle ? `<news:news>
      <news:publication>
        <news:name>Flight Drama</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${u.newsDate}</news:publication_date>
      <news:title>${escapeHtml(u.newsTitle)}</news:title>
      <news:keywords>${escapeHtml(u.newsCategory)}, aviation news</news:keywords>
    </news:news>` : ''}
  </url>`).join('\n')}
</urlset>`;
}

function proxyToTarget(req, res) {
  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: TARGET_HOST },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (e) => {
    console.error('[Prerender] Proxy error:', e.message);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer(async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const path = req.url.split('?')[0];

  // Health check
  if (path === '/__prerender_health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'flight-drama-prerender', version: 2, port: PORT }));
    return;
  }

  // Sitemap — serve for all requests (bots and browsers)
  if (path === '/sitemap.xml') {
    try {
      const sitemap = await renderSitemap();
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(sitemap);
      return;
    } catch (e) {
      console.error('[Prerender] Sitemap error:', e.message);
    }
  }

  // If not a bot, proxy transparently
  if (!isBot(ua)) {
    return proxyToTarget(req, res);
  }

  console.log(`[Prerender] Bot: ${ua.slice(0, 60)} | ${path}`);

  // Article page prerender
  const articleMatch = path.match(/^\/article\/([^/]+)\/?$/);
  if (articleMatch) {
    try {
      const html = await renderArticlePage(articleMatch[1]);
      if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>404 Not Found</h1></body></html>');
      return;
    } catch (e) {
      console.error('[Prerender] Article render error:', e.message);
    }
  }

  // Category page prerender
  const categoryMatch = path.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) {
    try {
      const html = await renderCategoryPage(categoryMatch[1]);
      if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    } catch (e) {
      console.error('[Prerender] Category render error:', e.message);
    }
  }

  // Tag page prerender
  const tagMatch = path.match(/^\/tag\/([^/]+)\/?$/);
  if (tagMatch) {
    try {
      const html = await renderTagPage(tagMatch[1]);
      if (html) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    } catch (e) {
      console.error('[Prerender] Tag render error:', e.message);
    }
  }

  // For all other bot requests, proxy to the site
  proxyToTarget(req, res);
});

server.listen(PORT, () => {
  console.log(`[Prerender] Flight Drama prerender proxy v2 running on port ${PORT}`);
  console.log(`[Prerender] Health: http://localhost:${PORT}/__prerender_health`);
  console.log(`[Prerender] Sitemap: http://localhost:${PORT}/sitemap.xml`);
});

process.on('uncaughtException', (e) => console.error('[Prerender] Uncaught:', e.message));
process.on('unhandledRejection', (e) => console.error('[Prerender] Unhandled rejection:', e));
