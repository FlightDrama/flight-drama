/**
 * Flight Drama — Instagram Auto-Sync v2
 * ========================================
 * Runs every 6 hours on the persistent cloud computer.
 * 1. Uses Playwright headless browser to scrape @flightdrama Instagram
 * 2. Checks which posts are already in the database
 * 3. Generates full AdSense-compliant articles using Claude Opus
 * 4. Sources images from Pexels, Unsplash, and Wikimedia Commons
 * 5. Publishes them directly to the Flight Drama database
 *
 * Schedule: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
 * Log: /home/ubuntu/flight-drama-cron/instagram-sync-v2.log
 */
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
const require = createRequire(import.meta.url);
const mysql = require('mysql2/promise');

const FORGE_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_KEY = 'DISABLED_OLD_OM_KEY';
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

const LOG_FILE = path.join(__dirname, 'instagram-sync-v2.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Scrape Instagram using Playwright ─────────────────────────────────────
async function scrapeInstagramWithPlaywright() {
  log('Attempting Playwright scrape...');
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 },
      locale: 'en-GB',
    });
    const page = await context.newPage();
    
    // Navigate to Instagram profile
    await page.goto('https://www.instagram.com/flightdrama/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Scroll to load more posts
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 800));
      await page.waitForTimeout(1500);
    }
    
    // Extract post captions from alt text and aria labels
    const posts = await page.evaluate(() => {
      const results = [];
      // Get all post links
      const links = document.querySelectorAll('a[href*="/p/"]');
      links.forEach(link => {
        const img = link.querySelector('img');
        if (img) {
          const alt = img.getAttribute('alt') || '';
          const caption = img.getAttribute('aria-label') || alt;
          // Extract text from the Flight Drama style captions
          const match = caption.match(/text[^"]*"([^"]{30,})"/i) || 
                        caption.match(/says?\s+'([^']{30,})'/i) ||
                        caption.match(/text[^.]*\.\s*(.{30,})/i);
          const text = match ? match[1] : caption;
          if (text && text.length > 30 && text.toLowerCase().includes('flight drama') === false) {
            // Clean up the text
            const cleaned = text.replace(/FLIGHT DRAMA/gi, '').replace(/\s+/g, ' ').trim();
            if (cleaned.length > 20) {
              results.push({
                caption: cleaned,
                url: link.href,
              });
            }
          }
        }
      });
      return results;
    });
    
    await browser.close();
    log(`Playwright found ${posts.length} posts`);
    return posts;
  } catch (e) {
    log(`Playwright error: ${e.message}`);
    return [];
  }
}

// ── Fallback: scrape via page HTML ────────────────────────────────────────
async function scrapeInstagramFallback() {
  log('Trying HTML scrape fallback...');
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  
  for (const ua of userAgents) {
    try {
      await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
      const res = await fetch('https://www.instagram.com/flightdrama/', {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) { log(`HTTP ${res.status}`); continue; }
      const html = await res.text();
      
      // Extract captions from JSON data in page source
      const posts = [];
      const captionMatches = html.matchAll(/"caption":\s*"([^"]{50,500})"/g);
      for (const match of captionMatches) {
        const caption = match[1].replace(/\\n/g, ' ').replace(/\\u[\dA-F]{4}/gi, '').trim();
        if (caption.length > 30) {
          posts.push({ caption, url: '' });
        }
      }
      
      // Also try alt text extraction
      const altMatches = html.matchAll(/alt="([^"]{50,300})"/g);
      for (const match of altMatches) {
        const alt = match[1];
        if (alt.includes('FLIGHT DRAMA') || alt.includes('FlightDrama')) {
          // Extract the headline from the image alt text
          const cleaned = alt.replace(/FLIGHT DRAMA/gi, '').replace(/\s+/g, ' ').trim();
          if (cleaned.length > 20) {
            posts.push({ caption: cleaned, url: '' });
          }
        }
      }
      
      if (posts.length > 0) {
        log(`HTML fallback found ${posts.length} posts`);
        return posts;
      }
    } catch (e) {
      log(`Fetch error: ${e.message}`);
    }
  }
  return [];
}

// ── Image search ───────────────────────────────────────────────────────────
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
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' aircraft')}&srnamespace=6&srlimit=5&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstResult = searchData.query?.search?.[0];
    if (!firstResult) return null;
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

async function findImage(caption) {
  // Extract key terms from caption for image search
  const words = caption.split(' ').filter(w => w.length > 3).slice(0, 4).join(' ');
  const queries = [
    words + ' airplane',
    caption.split(' ').slice(0, 3).join(' ') + ' aircraft',
    'commercial airplane flight',
  ];
  
  for (const query of queries) {
    const pexels = await searchPexels(query);
    if (pexels) return pexels;
    const unsplash = await searchUnsplash(query);
    if (unsplash) return unsplash;
    const wiki = await searchWikimedia(query);
    if (wiki) return wiki;
  }
  return null;
}

// ── Generate article with Claude Opus ─────────────────────────────────────
async function generateArticle(caption) {
  const prompt = `You are a professional aviation journalist writing for Flight Drama (flightdrama.com), a UK-based aviation news platform with a Lad Bible-style tone — engaging, punchy, and accessible to aviation enthusiasts.

Write a full news article based on this Instagram post caption/headline: "${caption}"

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

Respond in JSON format:
{
  "title": "Compelling article title",
  "excerpt": "2-sentence excerpt for article cards",
  "content": "<p>Full HTML article content...</p>",
  "metaTitle": "SEO title max 60 chars",
  "metaDescription": "SEO description max 160 chars",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "aviation-incidents|commercial-aviation|aircraft-tech|military-aviation|flight-training|space-future"
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

// ── Helpers ────────────────────────────────────────────────────────────────
function toSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function getExistingTitles(conn) {
  const [rows] = await conn.execute('SELECT title FROM articles');
  return rows.map(r => r.title.toLowerCase());
}

async function getCategoryMap(conn) {
  const [rows] = await conn.execute('SELECT id, slug FROM categories');
  const map = {};
  for (const r of rows) map[r.slug] = r.id;
  return map;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('=== Flight Drama Instagram Sync v2 Starting ===');
  
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const catMap = await getCategoryMap(conn);
  const existingTitles = await getExistingTitles(conn);
  
  const [authors] = await conn.execute('SELECT id FROM authors LIMIT 1');
  const authorId = authors[0]?.id;
  
  // Try Playwright first, then fallback
  let posts = await scrapeInstagramWithPlaywright();
  if (posts.length === 0) {
    posts = await scrapeInstagramFallback();
  }
  
  if (posts.length === 0) {
    log('No posts found from Instagram. Will retry next run.');
    await conn.end();
    return;
  }
  
  log(`Found ${posts.length} posts to process`);
  
  let published = 0;
  let skipped = 0;
  
  for (const post of posts) {
    try {
      const caption = post.caption.trim();
      if (caption.length < 30) { skipped++; continue; }
      
      // Dedup check
      const captionLower = caption.toLowerCase();
      const isDuplicate = existingTitles.some(t => {
        const words = captionLower.split(' ').filter(w => w.length > 4);
        return words.filter(w => t.includes(w)).length >= 4;
      });
      if (isDuplicate) {
        log(`SKIP (duplicate): ${caption.slice(0, 60)}`);
        skipped++;
        continue;
      }
      
      log(`Generating: ${caption.slice(0, 80)}...`);
      const generated = await generateArticle(caption);
      
      let slug = toSlug(generated.title || caption);
      const [existSlug] = await conn.execute('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
      if (existSlug.length > 0) slug = slug + '-' + Date.now().toString(36);
      
      const imageUrl = await findImage(caption);
      const categorySlug = generated.category || 'commercial-aviation';
      const categoryId = catMap[categorySlug] || catMap['commercial-aviation'];
      
      await conn.execute(
        `INSERT INTO articles (title, slug, excerpt, content, featuredImage, categoryId, authorId, publishedAt, isBreaking, isFeatured, isPro, status, metaTitle, metaDescription, tags, views, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 0, 0, 0, 'published', ?, ?, ?, 0, NOW(), NOW())`,
        [
          generated.title || caption.slice(0, 200),
          slug,
          generated.excerpt || '',
          generated.content || '',
          imageUrl || null,
          categoryId,
          authorId,
          generated.metaTitle || (generated.title || caption).slice(0, 60),
          generated.metaDescription || '',
          JSON.stringify(generated.tags || []),
        ]
      );
      
      existingTitles.push((generated.title || caption).toLowerCase());
      log(`  ✅ Published: "${generated.title || caption.slice(0, 60)}" | Image: ${imageUrl ? 'found' : 'none'}`);
      published++;
      
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
    }
  }
  
  await conn.end();
  log(`=== Sync Complete: ${published} published, ${skipped} skipped ===`);
}

main().catch(e => {
  log(`FATAL ERROR: ${e.message}`);
  process.exit(1);
});
