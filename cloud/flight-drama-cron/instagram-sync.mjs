/**
 * Flight Drama — Instagram Auto-Sync
 * ====================================
 * Runs weekly on the persistent cloud computer.
 * 1. Scrapes @flightdrama Instagram page for new posts
 * 2. Checks which posts are already in the database
 * 3. Generates full AdSense-compliant articles using the LLM
 * 4. Publishes them directly to the Flight Drama database
 *
 * Schedule: Every Monday at 08:00 UTC
 * Log: /home/ubuntu/flight-drama-cron/instagram-sync.log
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

// ── Logging ────────────────────────────────────────────────────────────────
const LOG_FILE = path.join(__dirname, 'instagram-sync.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ── Config ─────────────────────────────────────────────────────────────────
const FORGE_URL = GROQ_API_URL;
const FORGE_KEY = GROQ_API_KEY || MISTRAL_API_KEY;
const IG_URL = process.env.INSTAGRAM_URL || 'https://www.instagram.com/flightdrama/';

// ── Scrape Instagram ───────────────────────────────────────────────────────
async function scrapeInstagram() {
  log('Scraping Instagram page...');

  // Try multiple user agents with delays between attempts
  const userAgents = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ];

  let html = '';
  for (const ua of userAgents) {
    try {
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      const res = await fetch(IG_URL, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        html = await res.text();
        log(`Scraped with UA: ${ua.slice(0, 40)}...`);
        break;
      }
      log(`HTTP ${res.status} with UA: ${ua.slice(0, 40)}...`);
    } catch (e) {
      log(`Fetch error: ${e.message}`);
    }
  }

  if (!html) {
    // Fallback: try the Manus webpage extract API
    log('Direct scrape failed — trying Manus extract API...');
    try {
      const extractRes = await fetch('https://forge.manus.ai/v1/tools/webpage_extract', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${FORGE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [IG_URL] }),
      });
      if (extractRes.ok) {
        const extractData = await extractRes.json();
        html = extractData?.results?.[0]?.content || '';
        if (html) log('Got content from Manus extract API');
      }
    } catch (e) {
      log(`Extract API error: ${e.message}`);
    }
  }

  if (!html) {
    log('All scraping methods failed. Will retry next run.');
    return [];
  }

  try {
    // Extract post captions from the page source
    const posts = [];

    // Try to extract from shared_data JSON
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});<\/script>/s);
    if (sharedDataMatch) {
      try {
        const data = JSON.parse(sharedDataMatch[1]);
        const edges = data?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_owner_to_timeline_media?.edges || [];
        for (const edge of edges.slice(0, 15)) {
          const node = edge.node;
          const caption = node?.edge_media_to_caption?.edges?.[0]?.node?.text || '';
          if (caption && caption.length > 50) {
            posts.push({
              caption: caption.trim(),
              timestamp: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : new Date().toISOString(),
              shortcode: node.shortcode,
            });
          }
        }
      } catch {}
    }

    // Fallback: extract captions from meta tags and text patterns
    if (posts.length === 0) {
      // Extract long text blocks that look like post captions (aviation content)
      const captionPattern = /(?:A |An |The |Boeing|Airbus|Ryanair|EasyJet|British Airways|Virgin|Delta|United|American|Emirates|Qantas|Wizz|Turkish)[^<]{100,1500}/g;
      const matches = html.match(captionPattern) || [];
      for (const match of matches.slice(0, 10)) {
        const clean = match.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\u[\dA-F]{4}/gi, '').trim();
        if (clean.length > 100 && !posts.some(p => p.caption.includes(clean.slice(0, 50)))) {
          posts.push({
            caption: clean,
            timestamp: new Date().toISOString(),
            shortcode: null,
          });
        }
      }
    }

    log(`Found ${posts.length} posts on Instagram`);
    return posts;
  } catch (e) {
    log(`ERROR scraping Instagram: ${e.message}`);
    return [];
  }
}

// ── Check for duplicates ───────────────────────────────────────────────────
async function getExistingTitles(conn) {
  const [rows] = await conn.execute('SELECT title, slug FROM articles ORDER BY publishedAt DESC LIMIT 100');
  return rows.map(r => r.title.toLowerCase());
}

// ── Generate article with LLM ──────────────────────────────────────────────
async function generateArticle(caption) {
  const prompt = `You are a senior aviation journalist for Flight Drama, a major aviation news website with millions of followers.

Write a high-quality, SEO-optimised aviation news article based on the following social media post. Rewrite it in your own words — keep all specific facts, flight numbers, aircraft types, dates, and quotes, but expand the story with context, analysis, and background information.

SOCIAL MEDIA POST:
${caption}

Requirements:
- Write in British English
- 600-900 words
- Use proper HTML: <h2> for 2-3 subheadings, <p> for paragraphs, <blockquote> for key quotes
- Do NOT include a main <h1> title
- Do NOT use markdown, only HTML tags
- Be factual, balanced, and informative
- No graphic violence or disturbing content
- AdSense compliant — no sensationalism, no misleading claims
- End with a strong concluding paragraph

Return ONLY a JSON object with these exact fields:
{
  "title": "Compelling headline (max 80 chars)",
  "excerpt": "1-2 sentence summary (max 160 chars)",
  "content": "Full HTML article",
  "metaTitle": "SEO title (max 60 chars)",
  "metaDescription": "SEO description (max 160 chars)",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "category": "aviation-incidents|commercial-aviation|aircraft-tech|military-aviation|flight-training|future-aviation"
}`;

  const res = await fetch(`${FORGE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FORGE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
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

// ── Category map ───────────────────────────────────────────────────────────
async function getCategoryMap(conn) {
  const [rows] = await conn.execute('SELECT id, slug FROM categories');
  const map = {};
  for (const r of rows) map[r.slug] = r.id;
  return map;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  log('=== Flight Drama Instagram Sync Starting ===');

  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const catMap = await getCategoryMap(conn);
  const existingTitles = await getExistingTitles(conn);

  // Get default author
  const [authors] = await conn.execute('SELECT id FROM authors LIMIT 1');
  const authorId = authors[0]?.id;

  const posts = await scrapeInstagram();

  if (posts.length === 0) {
    log('No posts found — Instagram may require login. Exiting.');
    await conn.end();
    return;
  }

  let published = 0;
  let skipped = 0;

  for (const post of posts) {
    try {
      // Skip very short captions
      if (post.caption.length < 100) { skipped++; continue; }

      // Skip if it looks like a duplicate (first 60 chars of caption match existing title)
      const captionStart = post.caption.slice(0, 60).toLowerCase();
      const isDuplicate = existingTitles.some(t => {
        const words = captionStart.split(' ').filter(w => w.length > 4);
        return words.filter(w => t.includes(w)).length >= 3;
      });

      if (isDuplicate) {
        log(`  SKIP (duplicate): ${post.caption.slice(0, 60)}...`);
        skipped++;
        continue;
      }

      log(`  Generating article for: ${post.caption.slice(0, 60)}...`);
      const generated = await generateArticle(post.caption);

      const slug = toSlug(generated.title);

      // Check for duplicate slug
      const [existing] = await conn.execute('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
      if (existing.length > 0) {
        log(`  SKIP (slug exists): ${slug}`);
        skipped++;
        continue;
      }

      // Map category
      const categorySlug = generated.category || 'commercial-aviation';
      const categoryId = catMap[categorySlug] || catMap['commercial-aviation'];

      // Insert article
      await conn.execute(
        `INSERT INTO articles (title, slug, excerpt, content, featuredImage, categoryId, authorId, publishedAt, isBreaking, isFeatured, isPro, status, metaTitle, metaDescription, tags, views, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, NULL, ?, ?, NOW(), 0, 0, 0, 'published', ?, ?, ?, 0, NOW(), NOW())`,
        [
          generated.title,
          slug,
          generated.excerpt,
          generated.content,
          categoryId,
          authorId,
          generated.metaTitle,
          generated.metaDescription,
          JSON.stringify(generated.suggestedTags),
        ]
      );

      log(`  ✅ Published: "${generated.title}"`);
      published++;

      // Small delay between LLM calls
      await new Promise(r => setTimeout(r, 2000));

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
