/**
 * Claude Image System — Full Backfill
 * 
 * Runs through ALL published articles + ALL draft articles in the queue.
 * Skips articles with Josh's branded manus-storage images (those are perfect already).
 * Uses the updated Claude Opus 4.8 system with:
 *   - Varied image types (people/crew for incidents, terminals for delays, etc.)
 *   - 30-day dedup window
 *   - High-detail vision verification
 * 
 * Run persistently on cloud computer with nohup.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-all.log');
const PROGRESS_FILE = join(__dirname, 'backfill-progress.json');

// Clear log on start
writeFileSync(LOG_FILE, `=== Full Backfill Started: ${new Date().toISOString()} ===\n`);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';

// Cost tracking
let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalApiCalls = 0;

const PRICE_INPUT_PER_M = 15.00;
const PRICE_OUTPUT_PER_M = 75.00;

function addCost(inputTokens, outputTokens) {
  totalInputTokens += inputTokens;
  totalOutputTokens += outputTokens;
  totalApiCalls++;
}

function getCostReport() {
  const inputCost = (totalInputTokens / 1_000_000) * PRICE_INPUT_PER_M;
  const outputCost = (totalOutputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
  const totalUSD = inputCost + outputCost;
  const totalGBP = totalUSD * 0.79;
  return {
    calls: totalApiCalls,
    inputTokens: totalInputTokens,
    outputTokens: totalOutputTokens,
    totalUSD: totalUSD.toFixed(4),
    totalGBP: totalGBP.toFixed(4),
  };
}

// ─── Query generation ─────────────────────────────────────────────────────────

async function generateQueriesWithClaude(title, excerpt, bodyStart) {
  const context = [title, excerpt, bodyStart].filter(Boolean).join('\n\n').slice(0, 600);
  
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 400,
        messages: [{ role: 'user', content: `You are selecting a featured image for an aviation news article. Generate 4 image search queries, from most to least specific.

ARTICLE CONTEXT:
${context}

RULES:
- Think like a news photo editor. Choose the image type that best tells THIS story visually:
  * Stories about passengers/crew/incidents → prefer PEOPLE photos: flight attendants, cabin crew, passengers in cabin, boarding queues, airport crowds. An external aircraft shot is boring for these stories.
  * Stories about a specific airline's operations/routes/fleet → external aircraft with livery is fine
  * Stories about delays/cancellations → airport terminal, departure board, waiting passengers
  * Stories about technical/mechanical issues → maintenance crew, engine close-up, aircraft in hangar
  * Stories about crashes/emergencies → emergency vehicles on runway, aircraft damage, fire crews
- If a specific airline is mentioned, include the airline name in at least one query
- If a specific aircraft type is mentioned, include it where relevant
- If a specific location or airport is mentioned, include it in one query
- Query 4 should be a broader fallback that still fits the story type
- NEVER mix airlines — if the story is about Ryanair, don't search for generic "blue aircraft"

Respond ONLY with JSON array: ["query1","query2","query3","query4"]` }]
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    addCost(data.usage?.prompt_tokens || 400, data.usage?.completion_tokens || 80);
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const queries = JSON.parse(match[0]);
      log(`  Queries: ${queries.join(' | ')}`);
      return queries;
    }
  } catch (e) {
    log(`  Query generation failed: ${e.message}`);
  }
  return null;
}

// ─── Photo fetchers ───────────────────────────────────────────────────────────

async function fetchFromPexels(query, attempt = 0) {
  if (!PEXELS_API_KEY) return null;
  try {
    const page = Math.floor(attempt / 8) + 1;
    const idx = attempt % 8;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) return null;
    const pick = data.photos[idx % data.photos.length];
    return { url: pick.src?.large2x || pick.src?.large, attribution: pick.photographer ? `Photo by ${pick.photographer} on Pexels` : null, source: 'Pexels' };
  } catch { return null; }
}

async function fetchFromWikimedia(query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.query?.search || []).filter(r => r.title.match(/\.(jpg|jpeg|png)$/i));
    for (const r of results.slice(0, 3)) {
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query?.pages || {});
      const url = pages[0]?.imageinfo?.[0]?.url;
      if (url && !url.endsWith('.svg')) {
        const meta = pages[0]?.imageinfo?.[0]?.extmetadata || {};
        const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null;
        const licence = meta.LicenseShortName?.value || null;
        return {
          url,
          attribution: artist ? `Photo: ${artist} via Wikimedia Commons${licence ? ` (${licence})` : ''}` : 'Photo: Wikimedia Commons',
          source: 'Wikimedia'
        };
      }
    }
  } catch {}
  return null;
}

async function fetchFromPixabay(query) {
  if (!PIXABAY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hits?.length) return null;
    const pick = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))];
    return { url: pick.largeImageURL || pick.webformatURL, attribution: pick.user ? `Photo by ${pick.user} on Pixabay` : null, source: 'Pixabay' };
  } catch { return null; }
}

// ─── Claude verification ──────────────────────────────────────────────────────

async function verifyWithClaudeHighDetail(imageUrl, articleContext, primarySubject) {
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 200,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          { type: 'text', text: `You are verifying a featured image for an aviation news article.

ARTICLE: "${articleContext.slice(0, 200)}"
PRIMARY SUBJECT: ${primarySubject}

STRICT VERIFICATION RULES:
1. READ the actual text/logo on the aircraft livery carefully
2. If the article mentions a specific airline, the image MUST show THAT airline's aircraft (correct logo/livery) OR relevant people/scenes from that story
3. A blue aircraft is NOT automatically United Airlines — read the actual text
4. People photos (flight attendants, passengers, cabin crew) are GREAT for incident/passenger stories
5. Score 8-10 only if the image genuinely matches the story
6. Score 1-4 if it shows a DIFFERENT airline than mentioned, or is completely irrelevant

Respond ONLY with JSON:
{"correct": true/false, "score": 1-10, "airlineShown": "exact airline name visible or 'N/A'", "reason": "brief", "betterQuery": "improved search query if wrong, or null"}` }
        ]}]
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) { log(`  Claude verify ${res.status}`); return null; }
    const data = await res.json();
    addCost(data.usage?.prompt_tokens || 800, data.usage?.completion_tokens || 100);
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const result = JSON.parse(match[0]);
    log(`  Claude: score ${result.score}/10, correct=${result.correct} — ${result.reason?.slice(0, 60)}`);
    return result;
  } catch (e) { log(`  Claude verify error: ${e.message}`); return null; }
}

// ─── AI image generation fallback ────────────────────────────────────────────

async function generateImageWithForge(prompt) {
  try {
    const res = await fetch(`${FORGE_API_URL}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Professional aviation news photograph: ${prompt}. Photorealistic, no text overlays, clean aviation subject.`,
        n: 1,
        size: '1280x720',
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.url || null;
  } catch { return null; }
}

// Global dedup set for this run
const usedUrls = new Set();

// ─── Process one article ──────────────────────────────────────────────────────

async function processArticle(article) {
  const bodyStart = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500);
  const articleContext = `${article.title}\n${article.excerpt || ''}\n${bodyStart}`;

  const queries = await generateQueriesWithClaude(article.title, article.excerpt, bodyStart);
  if (!queries) { log(`  Failed to generate queries`); return null; }

  let bestPhoto = null;
  let bestScore = 0;
  let lastBetterQuery = null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const query = lastBetterQuery || queries[Math.min(attempt, queries.length - 1)];
    log(`\n  [Attempt ${attempt + 1}/8] Query: "${query}"`);

    const sources = [
      () => fetchFromPexels(query, attempt),
      () => fetchFromWikimedia(query),
      () => fetchFromPixabay(query),
    ];

    for (const sourceFn of sources) {
      const photo = await sourceFn();
      if (!photo?.url) continue;

      log(`  [${photo.source}] ${photo.url.slice(0, 70)}`);

      if (usedUrls.has(photo.url)) {
        log(`  ⚠️ Duplicate — skipping`);
        continue;
      }

      const verification = await verifyWithClaudeHighDetail(photo.url, articleContext, queries[0]);
      if (!verification) continue;

      if (verification.score > bestScore) {
        bestScore = verification.score;
        bestPhoto = { ...photo, verification };
      }

      if (verification.correct && verification.score >= 7) {
        log(`  ✅ APPROVED: ${photo.source}, score ${verification.score}/10`);
        usedUrls.add(photo.url);
        return bestPhoto;
      }

      if (verification.betterQuery) {
        lastBetterQuery = verification.betterQuery;
        log(`  Claude suggests: "${lastBetterQuery}"`);
      }

      break;
    }

    await new Promise(r => setTimeout(r, 800));
  }

  if (bestPhoto && bestScore >= 6) {
    log(`  ⚠️ Using best available (score ${bestScore}/10): ${bestPhoto.source}`);
    usedUrls.add(bestPhoto.url);
    return bestPhoto;
  }

  log(`  🎨 All real photos failed (best: ${bestScore}/10) — generating with AI`);
  const genUrl = await generateImageWithForge(queries[0]);
  if (genUrl) {
    log(`  ✅ AI generated`);
    return { url: genUrl, attribution: 'AI-generated image', source: 'AI Generated', verification: { score: 7 } };
  }

  return bestPhoto;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Fetch ALL published + draft articles, skip manus-storage (Josh's branded images)
  const [articles] = await conn.execute(`
    SELECT id, title, excerpt, content, featuredImage, status
    FROM articles
    WHERE status IN ('published', 'draft')
    AND (
      featuredImage IS NULL
      OR featuredImage NOT LIKE '%manus-storage%'
    )
    ORDER BY 
      CASE status WHEN 'published' THEN 0 ELSE 1 END,
      publishedAt DESC
  `);

  log(`Found ${articles.length} articles to process (published first, then drafts)`);
  log(`Skipping manus-storage (Josh's branded images)`);

  // Pre-load recent images for dedup (last 30 days)
  const [recentImages] = await conn.execute(
    'SELECT featuredImage FROM articles WHERE status = "published" AND featuredImage IS NOT NULL AND publishedAt > DATE_SUB(NOW(), INTERVAL 30 DAY)'
  );
  recentImages.forEach(r => { if (r.featuredImage) usedUrls.add(r.featuredImage); });
  log(`Pre-loaded ${usedUrls.size} recent image URLs (30-day dedup)`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const statusLabel = article.status === 'published' ? '📰' : '📋';
    log(`\n${statusLabel} [${i + 1}/${articles.length}] ID:${article.id} — ${article.title?.slice(0, 60)}`);
    log(`  Current: ${article.featuredImage?.slice(0, 70) || 'none'}`);

    // Save progress
    try {
      const progress = { current: i + 1, total: articles.length, updated, skipped, failed, lastId: article.id, cost: getCostReport() };
      writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    } catch {}

    try {
      const photo = await processArticle(article);

      if (photo?.url) {
        const updateConn = await mysql.createConnection(process.env.DATABASE_URL);
        await updateConn.execute(
          'UPDATE articles SET featuredImage = ?, imageAttribution = ?, updatedAt = NOW() WHERE id = ?',
          [photo.url, photo.attribution || null, article.id]
        );
        await updateConn.end();
        log(`  ✅ Updated [${photo.source}]: ${photo.url.slice(0, 70)}`);
        updated++;
      } else {
        log(`  ⚠️ No photo found — skipping`);
        skipped++;
      }
    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
      failed++;
    }

    // Rate limiting pause between articles
    await new Promise(r => setTimeout(r, 2500));

    // Log running cost every 10 articles
    if ((i + 1) % 10 === 0) {
      const cost = getCostReport();
      log(`\n--- Progress: ${i + 1}/${articles.length} | Updated: ${updated} | Cost so far: $${cost.totalUSD} (£${cost.totalGBP}) ---\n`);
    }
  }

  await conn.end();

  const cost = getCostReport();
  log(`\n${'='.repeat(60)}`);
  log(`BACKFILL COMPLETE`);
  log(`Total articles processed: ${articles.length}`);
  log(`Updated: ${updated}`);
  log(`Skipped (no photo): ${skipped}`);
  log(`Errors: ${failed}`);
  log(`API calls: ${cost.calls}`);
  log(`Input tokens: ${cost.inputTokens.toLocaleString()}`);
  log(`Output tokens: ${cost.outputTokens.toLocaleString()}`);
  log(`Total cost: $${cost.totalUSD} USD (£${cost.totalGBP} GBP)`);
  log(`Cost per article: $${(parseFloat(cost.totalUSD) / Math.max(updated, 1)).toFixed(4)} USD`);
  log(`${'='.repeat(60)}`);
}

main().catch(e => { log(`Fatal: ${e.message}\n${e.stack}`); process.exit(1); });
