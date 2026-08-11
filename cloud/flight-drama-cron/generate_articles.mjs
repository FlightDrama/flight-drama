/**
 * Flight Drama — Batch Article Generator
 * ========================================
 * Generates full articles from Instagram post headlines using Claude Opus.
 * Sources images from Pexels, Unsplash, and Wikimedia Commons.
 * Publishes directly to the Flight Drama TiDB database.
 */
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/home/ubuntu/flight-drama-cron/.env' });
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = 'DISABLED_OLD_OM_KEY';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const LOG_FILE = path.join(__dirname, 'generate_articles.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Image search (Pexels → Unsplash → Wikimedia fallback) ─────────────────
async function searchPexels(query) {
  if (!PEXELS_KEY) return null;
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
      headers: { Authorization: PEXELS_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos?.[0];
    return photo ? photo.src.large2x || photo.src.large : null;
  } catch { return null; }
}

async function searchUnsplash(query) {
  if (!UNSPLASH_KEY) return null;
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.results?.[0];
    return photo ? photo.urls.regular : null;
  } catch { return null; }
}

async function searchWikimedia(query) {
  try {
    // Search Wikimedia Commons for aviation images
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' aircraft')}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstResult = searchData.query?.search?.[0];
    if (!firstResult) return null;
    
    // Get the image URL
    const title = firstResult.title;
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
    const infoRes = await fetch(infoUrl);
    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const pages = infoData.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || null;
  } catch { return null; }
}

async function findImage(keywords, headline) {
  // Build search queries from keywords
  const queries = [
    keywords.slice(0, 2).join(' ') + ' airplane',
    keywords[0] + ' aircraft',
    headline.split(' ').slice(0, 4).join(' ') + ' aviation',
    'commercial airplane flight',
  ];
  
  for (const query of queries) {
    // Try Pexels first
    const pexels = await searchPexels(query);
    if (pexels) { log(`  Image from Pexels: ${query}`); return pexels; }
    
    // Try Unsplash
    const unsplash = await searchUnsplash(query);
    if (unsplash) { log(`  Image from Unsplash: ${query}`); return unsplash; }
    
    // Try Wikimedia
    const wiki = await searchWikimedia(query);
    if (wiki) { log(`  Image from Wikimedia: ${query}`); return wiki; }
  }
  
  // Final fallback: generic aviation image from Unsplash
  const fallback = await searchUnsplash('commercial airplane airport');
  return fallback;
}

// ── Upload image to Manus S3 ───────────────────────────────────────────────
async function uploadImageToStorage(imageUrl, slug) {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    
    // Upload to Manus storage via the Flight Drama API
    const storageRes = await fetch('https://flightdrama.com/api/trpc/articles.uploadImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, slug }),
    });
    
    // If that doesn't work, just return the original URL (Pexels/Unsplash are CDN-hosted)
    return imageUrl;
  } catch {
    return imageUrl;
  }
}

// ── Generate article with Claude Opus ─────────────────────────────────────
async function generateArticle(headline, keywords, category) {
  const prompt = `You are a professional aviation journalist writing for Flight Drama (flightdrama.com), a UK-based aviation news platform with a Lad Bible-style tone — engaging, punchy, and accessible to aviation enthusiasts.

Write a full news article about this story: "${headline}"

Key topics/keywords to cover: ${keywords.join(', ')}

Requirements:
- British English throughout
- Engaging, punchy opening paragraph that hooks the reader immediately
- 600-900 words of well-researched, accurate content
- Include specific facts, figures, and context where relevant
- Write in HTML format with proper <p>, <h2>, <h3> tags
- Include 2-3 subheadings to break up the text
- End with a "What This Means For Passengers" or "What Happens Next" section
- AdSense-safe content (factual, no sensationalism, no graphic content)
- Do NOT include <html>, <head>, <body> tags — just the article content HTML

Also provide:
- A compelling article title (can differ slightly from the headline for SEO)
- A 160-character meta description
- A 2-sentence excerpt for the article card
- 3-5 relevant tags
- Category: one of: aviation-incidents, commercial-aviation, aircraft-tech, military-aviation, flight-training, space-future

Respond in JSON format:
{
  "title": "Article title",
  "excerpt": "2-sentence excerpt",
  "content": "<p>Full HTML article content...</p>",
  "metaTitle": "SEO title max 60 chars",
  "metaDescription": "SEO description max 160 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "commercial-aviation"
}`;

  const res = await fetch(`${FORGE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      messages: [
        { role: 'system', content: 'You are a professional aviation journalist. Always respond with valid JSON only, no markdown code blocks.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('No content from LLM');
  return JSON.parse(raw);
}

// ── Slug helper ────────────────────────────────────────────────────────────
function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('=== Flight Drama Batch Article Generator Starting ===');
  
  const articles = JSON.parse(fs.readFileSync(path.join(__dirname, 'new_ig_articles.json'), 'utf8'));
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get category map
  const [catRows] = await conn.execute('SELECT id, slug FROM categories');
  const catMap = {};
  for (const r of catRows) catMap[r.slug] = r.id;
  
  // Get default author
  const [authors] = await conn.execute('SELECT id FROM authors LIMIT 1');
  const authorId = authors[0]?.id;
  
  // Get existing titles for dedup
  const [existingRows] = await conn.execute('SELECT title, slug FROM articles');
  const existingTitles = existingRows.map(r => r.title.toLowerCase());
  const existingSlugs = new Set(existingRows.map(r => r.slug));
  
  let published = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const article of articles) {
    try {
      const { headline, category, keywords } = article;
      
      // Check for duplicate
      const headlineLower = headline.toLowerCase();
      const isDuplicate = existingTitles.some(t => {
        const words = headlineLower.split(' ').filter(w => w.length > 4);
        return words.filter(w => t.includes(w)).length >= 4;
      });
      
      if (isDuplicate) {
        log(`SKIP (duplicate): ${headline}`);
        skipped++;
        continue;
      }
      
      log(`Generating: ${headline}`);
      
      // Generate article content
      const generated = await generateArticle(headline, keywords, category);
      
      // Build slug
      let slug = toSlug(generated.title || headline);
      let slugAttempt = 0;
      while (existingSlugs.has(slug)) {
        slugAttempt++;
        slug = toSlug(generated.title || headline) + '-' + slugAttempt;
      }
      existingSlugs.add(slug);
      
      // Find image
      const imageUrl = await findImage(keywords, headline);
      
      // Map category
      const categorySlug = generated.category || category || 'commercial-aviation';
      const categoryId = catMap[categorySlug] || catMap['commercial-aviation'];
      
      // Insert article
      await conn.execute(
        `INSERT INTO articles (title, slug, excerpt, content, featuredImage, categoryId, authorId, publishedAt, isBreaking, isFeatured, isPro, status, metaTitle, metaDescription, tags, views, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 0, 'published', ?, ?, ?, 0, NOW(), NOW())`,
        [
          generated.title || headline,
          slug,
          generated.excerpt || '',
          generated.content || '',
          imageUrl || null,
          categoryId,
          authorId,
          generated.metaTitle || (generated.title || headline).slice(0, 60),
          generated.metaDescription || '',
          JSON.stringify(generated.tags || keywords.slice(0, 3)),
        ]
      );
      
      existingTitles.push((generated.title || headline).toLowerCase());
      log(`  ✅ Published: "${generated.title || headline}" | Image: ${imageUrl ? 'found' : 'none'}`);
      published++;
      
      // Delay between LLM calls to avoid rate limiting
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (e) {
      log(`  ❌ Error for "${article.headline}": ${e.message}`);
      failed++;
    }
  }
  
  await conn.end();
  log(`=== Complete: ${published} published, ${skipped} skipped, ${failed} failed ===`);
}

main().catch(e => {
  log(`FATAL ERROR: ${e.message}`);
  process.exit(1);
});
