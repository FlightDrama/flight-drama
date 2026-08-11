/**
 * Flight Drama Internal Linking System
 * 
 * Uses Claude Opus 4.8 to find the 3 most topically relevant published articles
 * for each article, then injects a "Related Articles" section at the end of the
 * article body. This is a major SEO signal for Google News.
 * 
 * Modes:
 *   - Backfill: runs on all published articles that don't have related links yet
 *   - New article: called from autopilot after publishing a new article
 * 
 * Run: node flight-drama-internal-links.mjs [--limit N] [--article-id ID]
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'internal-links.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

// NO FORGE/MANUS API — zero Manus credits
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SITE_URL = 'https://flightdrama.com';

// ─── Claude finds the 3 most relevant articles ───────────────────────────────

async function findRelatedArticles(targetArticle, candidateArticles) {
  // Build a compact list of candidates for Claude to evaluate
  const candidateList = candidateArticles
    .slice(0, 50) // Max 50 candidates to keep prompt manageable
    .map((a, i) => `${i}: "${a.title}" — ${(a.excerpt || '').slice(0, 80)}`)
    .join('\n');

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 150,
        messages: [{ role: 'user', content: `You are selecting "Related Articles" for an aviation news article.

TARGET ARTICLE: "${targetArticle.title}"
EXCERPT: ${(targetArticle.excerpt || '').slice(0, 120)}

CANDIDATE ARTICLES (index: title — excerpt):
${candidateList}

Select the 3 most relevant articles that a reader of the target article would genuinely want to read next. Prefer:
- Same airline or aircraft type
- Same type of incident (passenger incident, emergency landing, etc.)
- Same geographic region
- Avoid articles that are too similar (same event)

Respond ONLY with JSON array of 3 indices (0-based): [idx1, idx2, idx3]` }]
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) return null;
    const indices = JSON.parse(match[0]);
    return indices.map(i => candidateArticles[i]).filter(Boolean);
  } catch (e) {
    log(`  Claude related articles error: ${e.message}`);
    return null;
  }
}

// ─── Build the related articles HTML block ────────────────────────────────────

function buildRelatedLinksHtml(relatedArticles) {
  const items = relatedArticles.map(a => {
    const url = `${SITE_URL}/article/${a.slug}`;
    const title = a.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const excerpt = (a.excerpt || '').slice(0, 100).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const img = a.featuredImage || '';
    return `<li><a href="${url}"><strong>${title}</strong></a>${excerpt ? ` — ${excerpt}` : ''}</li>`;
  }).join('\n');

  return `\n\n<div class="related-articles" data-related="true">
<h3>Related Articles</h3>
<ul>
${items}
</ul>
</div>`;
}

// ─── Check if article already has related links ───────────────────────────────

function hasRelatedLinks(content) {
  return content && (
    content.includes('data-related="true"') ||
    content.includes('class="related-articles"') ||
    content.includes('<h3>Related Articles</h3>')
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith('--limit='));
  const articleIdArg = args.find(a => a.startsWith('--article-id='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 999;
  const specificId = articleIdArg ? parseInt(articleIdArg.split('=')[1]) : null;

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get all published articles for the candidate pool
  const [allPublished] = await conn.execute(
    'SELECT id, title, slug, excerpt, featuredImage, categoryId FROM articles WHERE status = "published" ORDER BY publishedAt DESC'
  );
  log(`Total published articles in pool: ${allPublished.length}`);

  // Get articles to process (those without related links, or a specific one)
  let toProcess;
  if (specificId) {
    const [rows] = await conn.execute('SELECT id, title, slug, excerpt, content, categoryId FROM articles WHERE id = ? AND status = "published"', [specificId]);
    toProcess = rows;
  } else {
    // TiDB requires LIMIT as integer literal, not parameter
    const [rows] = await conn.execute(
      `SELECT id, title, slug, excerpt, content, categoryId FROM articles WHERE status = 'published' AND (content NOT LIKE '%data-related%') ORDER BY publishedAt DESC LIMIT ${Number(limit)}`
    );
    toProcess = rows;
  }

  log(`Articles to process: ${toProcess.length}`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const article = toProcess[i];
    log(`\n[${i + 1}/${toProcess.length}] ID:${article.id} — ${article.title?.slice(0, 60)}`);

    if (hasRelatedLinks(article.content)) {
      log(`  Already has related links — skipping`);
      skipped++;
      continue;
    }

    // Build candidate pool: exclude the article itself
    const candidates = allPublished.filter(a => a.id !== article.id);

    // Ask Claude to pick the 3 most relevant
    const related = await findRelatedArticles(article, candidates);

    if (!related || related.length === 0) {
      log(`  No related articles found`);
      skipped++;
      continue;
    }

    log(`  Related: ${related.map(r => r.title?.slice(0, 40)).join(' | ')}`);

    // Inject the related articles block at the end of the content
    const relatedHtml = buildRelatedLinksHtml(related);
    const newContent = (article.content || '') + relatedHtml;

    // Update in DB
    const updateConn = await mysql.createConnection(process.env.DATABASE_URL);
    await updateConn.execute(
      'UPDATE articles SET content = ?, updatedAt = NOW() WHERE id = ?',
      [newContent, article.id]
    );
    await updateConn.end();

    log(`  ✅ Updated with ${related.length} related links`);
    updated++;

    await new Promise(r => setTimeout(r, 1000));
  }

  await conn.end();

  log(`\n=== DONE ===`);
  log(`Updated: ${updated} | Skipped: ${skipped}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
