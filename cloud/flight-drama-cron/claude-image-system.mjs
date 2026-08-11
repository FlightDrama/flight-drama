/**
 * Flight Drama Image System v3 — Zero Forge/Manus Credits
 * 
 * Uses ONLY external APIs (no Manus Forge, no Claude, no Manus credits):
 *   - Groq (Llama 3.3 70B) — query generation, story classification, dedup
 *   - Mistral Pixtral (pixtral-12b-2409) — image vision verification (reads livery text)
 *   - Pexels, Unsplash, Wikimedia Commons, Pixabay, NASA, Flickr — image sources
 * 
 * Cost: £0 per article (all free tier APIs)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'claude-image-system.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_VISION_MODEL = 'pixtral-12b-2409'; // Mistral's vision model
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'; // Sonnet: quality/cost sweet spot ~$0.02/article

const CURRENT_YEAR = new Date().getFullYear();

// Global dedup set for this run
const usedUrls = new Set();

// ─── Groq text completion helper ─────────────────────────────────────────────

async function groqChat(messages, maxTokens = 300) {
  // Prefer Anthropic (Claude Opus) for quality; fall back to Groq
  if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'DISABLED') {
    const systemMsg = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    const anthropicMessages = userMessages.length > 0 ? userMessages : [{ role: 'user', content: messages[messages.length - 1]?.content || '' }];
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: maxTokens,
          ...(systemMsg ? { system: systemMsg.content } : {}),
          messages: anthropicMessages,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content?.[0]?.text || '';
      }
      log(`  Anthropic ${res.status} — falling back to Groq`);
    } catch (e) { log(`  Anthropic error: ${e.message} — falling back to Groq`); }
  }
  if (!GROQ_API_KEY) throw new Error('No ANTHROPIC_API_KEY or GROQ_API_KEY');
  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, max_tokens: maxTokens, messages }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── Story classification (Groq) ─────────────────────────────────────────────

async function classifyStory(title, excerpt, bodyStart) {
  const context = [title, excerpt, bodyStart].filter(Boolean).join('\n\n').slice(0, 400);
  try {
    const content = await groqChat([{ role: 'user', content: `Classify this aviation news article into ONE story type and sentiment.

ARTICLE:
${context}

Story types: passenger_incident, crew_incident, emergency_landing, crash_accident, fleet_news, airport_chaos, security, aviation_history, general_aviation, other

Sentiment: serious (crash/death/injury), neutral (routine), upbeat (positive news)

JSON only: {"storyType": "...", "sentiment": "...", "isBreakingNews": true/false}` }], 150);
    const match = content.match(/\{[\s\S]*?\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      log(`  Story type: ${result.storyType} | Sentiment: ${result.sentiment}`);
      return result;
    }
  } catch (e) { log(`  Classify error: ${e.message}`); }
  return { storyType: 'other', sentiment: 'neutral', isBreakingNews: false };
}

// ─── Query generation (Groq) ──────────────────────────────────────────────────

async function generateQueries(title, excerpt, bodyStart, storyMeta) {
  const context = [title, excerpt, bodyStart].filter(Boolean).join('\n\n').slice(0, 600);
  const storyType = storyMeta?.storyType || 'other';
  const sentiment = storyMeta?.sentiment || 'neutral';
  const isBreaking = storyMeta?.isBreakingNews || false;
  const yearHint = isBreaking ? ` Include "${CURRENT_YEAR}" in at least one query.` : '';

  const imageGuidance = {
    passenger_incident: 'Prefer PEOPLE photos: flight attendants, cabin crew, passengers in cabin. Avoid plain aircraft exterior.',
    crew_incident: 'Prefer PEOPLE photos: flight attendants, cabin crew in uniform.',
    emergency_landing: 'Emergency vehicles on runway, aircraft with fire trucks, airport emergency response.',
    crash_accident: 'Wreckage, investigators at scene, grounded aircraft. Tone must be serious — NO cheerful stock photos.',
    fleet_news: 'Aircraft exterior with correct airline livery. New aircraft delivery, aircraft in flight.',
    airport_chaos: 'Crowded airport terminal, departure board showing delays, queuing passengers.',
    security: 'Airport security, police at aircraft, security checkpoint.',
    aviation_history: 'Historical aircraft, vintage aviation, old airport photos.',
    general_aviation: 'Small aircraft, light aircraft, private plane, airfield.',
    other: 'Think like a news photo editor — choose whatever image type best illustrates this specific story.',
  }[storyType] || 'Think like a news photo editor.';

  const sentimentNote = sentiment === 'serious'
    ? 'IMPORTANT: Serious/tragic story. Do NOT suggest cheerful stock photos.'
    : '';

  try {
    const content = await groqChat([{ role: 'user', content: `You are selecting a featured image for an aviation news article. Generate 4 image search queries, from most to least specific.

ARTICLE CONTEXT:
${context}

STORY TYPE: ${storyType}
IMAGE GUIDANCE: ${imageGuidance}
${sentimentNote}
${yearHint}

RULES:
- If a specific airline is mentioned, include the airline name in at least one query
- If a specific aircraft type is mentioned, include it where relevant
- If a specific location or airport is mentioned, include it in one query
- Query 4 should be a broader fallback that still fits the story type
- NEVER mix airlines — if the story is about Ryanair, don't search for generic "blue aircraft"

Respond ONLY with JSON array: ["query1","query2","query3","query4"]` }], 400);
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const queries = JSON.parse(match[0]);
      log(`  Queries: ${queries.join(' | ')}`);
      return queries;
    }
  } catch (e) { log(`  Query generation failed: ${e.message}`); }
  return null;
}

// ─── Image sources ────────────────────────────────────────────────────────────

async function fetchMultipleFromPexels(query, count = 3, attempt = 0) {
  if (!PEXELS_API_KEY) return [];
  try {
    const page = Math.floor(attempt / 5) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const picks = [];
    for (const photo of (data.photos || [])) {
      const url = photo.src?.large2x || photo.src?.large;
      if (url && !usedUrls.has(url)) {
        picks.push({ url, attribution: photo.photographer ? `Photo by ${photo.photographer} on Pexels` : null, source: 'Pexels' });
        if (picks.length >= count) break;
      }
    }
    return picks;
  } catch { return []; }
}

async function fetchMultipleFromUnsplash(query, count = 2) {
  try {
    if (UNSPLASH_ACCESS_KEY) {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const picks = [];
        for (const photo of (data.results || [])) {
          const url = photo.urls?.regular || photo.urls?.full;
          if (url && !usedUrls.has(url)) {
            picks.push({ url, attribution: photo.user?.name ? `Photo by ${photo.user.name} on Unsplash` : 'Photo from Unsplash', source: 'Unsplash' });
            if (picks.length >= count) break;
          }
        }
        if (picks.length > 0) return picks;
      }
    }
  } catch {}
  return [];
}

async function fetchFromWikimedia(query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=8&format=json&origin=*`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.query?.search || []).filter(r => r.title.match(/\.(jpg|jpeg|png)$/i));
    const picks = [];
    for (const r of results.slice(0, 5)) {
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query?.pages || {});
      const url = pages[0]?.imageinfo?.[0]?.url;
      if (url && !url.endsWith('.svg') && !usedUrls.has(url)) {
        const meta = pages[0]?.imageinfo?.[0]?.extmetadata || {};
        const artist = meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null;
        const licence = meta.LicenseShortName?.value || null;
        picks.push({
          url,
          attribution: artist ? `Photo: ${artist} via Wikimedia Commons${licence ? ` (${licence})` : ''}` : 'Photo: Wikimedia Commons',
          source: 'Wikimedia'
        });
        if (picks.length >= 2) break;
      }
    }
    return picks;
  } catch { return []; }
}

async function fetchMultipleFromPixabay(query, count = 2) {
  if (!PIXABAY_API_KEY) return [];
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=15&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const picks = [];
    for (const photo of (data.hits || [])) {
      const url = photo.largeImageURL || photo.webformatURL;
      if (url && !usedUrls.has(url)) {
        picks.push({ url, attribution: photo.user ? `Photo by ${photo.user} on Pixabay` : null, source: 'Pixabay' });
        if (picks.length >= count) break;
      }
    }
    return picks;
  } catch { return []; }
}

// ─── Mistral Pixtral vision verification ─────────────────────────────────────

async function verifyWithPixtral(candidates, articleContext, storyType, primarySubject) {
  // Uses Claude Sonnet vision — better at reading airline livery text than Pixtral
  if (!ANTHROPIC_API_KEY || candidates.length === 0) return null;

  const indexLabels = candidates.slice(0, 3).map((_, i) => `Image ${i + 1}`).join(', ');

  // Build Anthropic-format multi-image message
  const imageContent = candidates.slice(0, 3).flatMap((c, i) => [
    { type: 'image', source: { type: 'url', url: c.url } },
    { type: 'text', text: `(Image ${i + 1} from ${c.source})` }
  ]);

  const promptText = `You are a news photo editor selecting the best featured image for an aviation article.

ARTICLE: "${articleContext.slice(0, 200)}"
STORY TYPE: ${storyType}
PRIMARY SUBJECT: ${primarySubject}

You are looking at ${Math.min(candidates.length, 3)} candidate images (${indexLabels}).

For each image:
1. READ any text/logos carefully (airline names, livery, signage)
2. Assess how well it illustrates THIS specific story
3. Consider: correct airline shown? Correct tone? Interesting composition? Relevant subject?

Pick the BEST image. Score 1-10 for relevance.

JSON only: {"bestIndex": 0, "score": 1-10, "correct": true/false, "airlineShown": "name or N/A", "reason": "brief", "betterQuery": "improved query if all are poor, or null"}
(bestIndex is 0-based)`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 300,
        messages: [{ role: 'user', content: [...imageContent, { type: 'text', text: promptText }] }]
      }),
      signal: AbortSignal.timeout(40000),
    });
    if (!res.ok) {
      const errText = await res.text();
      log(`  Sonnet vision ${res.status}: ${errText.slice(0, 100)} — falling back to Groq text-only`);
      return null; // Caller will fall back to scoreWithGroqTextOnly
    }
    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) return null;
    const result = JSON.parse(match[0]);
    const chosen = candidates[result.bestIndex] || candidates[0];
    log(`  Sonnet vision picked Image ${result.bestIndex + 1} (${chosen.source}): score ${result.score}/10, correct=${result.correct} — ${result.reason?.slice(0, 60)}`);
    return { ...chosen, verification: result };
  } catch (e) {
    log(`  Sonnet vision error: ${e.message} — falling back to Groq text-only`);
    return null;
  }
}

// Fallback: Groq text-only scoring (when Pixtral fails or no vision available)
async function scoreWithGroqTextOnly(candidates, articleContext, primarySubject) {
  if (!GROQ_API_KEY || candidates.length === 0) return candidates[0] || null;
  try {
    const candidateList = candidates.map((c, i) => `${i}: [${c.source}] URL contains: ${c.url.split('/').pop().slice(0, 40)}`).join('\n');
    const content = await groqChat([{ role: 'user', content: `You are selecting the best image for an aviation article.

ARTICLE: "${articleContext.slice(0, 150)}"
PRIMARY SUBJECT: ${primarySubject}

CANDIDATES (index: source and URL hint):
${candidateList}

Based on the URL hints and article context, which image is most likely to show relevant aviation content?
Pick the best index. JSON only: {"bestIndex": 0, "score": 6, "correct": true, "airlineShown": "unknown", "reason": "best match", "betterQuery": null}` }], 150);
    const match = content.match(/\{[\s\S]*?\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      const chosen = candidates[result.bestIndex] || candidates[0];
      log(`  Groq text-only picked Image ${result.bestIndex + 1} (${chosen.source}): score ${result.score}/10`);
      return { ...chosen, verification: result };
    }
  } catch (e) { log(`  Groq text-only error: ${e.message}`); }
  return { ...candidates[0], verification: { score: 5, correct: true, airlineShown: 'unknown', reason: 'fallback', betterQuery: null } };
}

// ─── Diversity check (Groq text-only, fast) ──────────────────────────────────

async function checkDiversity(candidateUrl, recentImageUrls) {
  if (!recentImageUrls || recentImageUrls.length === 0) return true;
  // Simple URL-based check — if the same domain+path prefix appears, skip
  const candidatePath = candidateUrl.split('?')[0];
  const isDuplicate = recentImageUrls.some(url => url && url.split('?')[0] === candidatePath);
  if (isDuplicate) {
    log(`  Diversity: exact URL match found — skipping`);
    return false;
  }
  return true;
}

// ─── Main: Process an article ────────────────────────────────────────────────

export async function processArticle(article, recentImageUrls = []) {
  const bodyStart = (article.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500);
  const articleContext = `${article.title}\n${article.excerpt || ''}\n${bodyStart}`;

  // Classify story type
  const storyMeta = await classifyStory(article.title, article.excerpt, bodyStart);
  const storyType = storyMeta?.storyType || 'other';

  // Generate queries
  const queries = await generateQueries(article.title, article.excerpt, bodyStart, storyMeta);
  if (!queries) { log(`  Failed to generate queries`); return null; }

  let bestPhoto = null;
  let bestScore = 0;
  let lastBetterQuery = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const query = lastBetterQuery || queries[Math.min(attempt, queries.length - 1)];
    log(`\n  [Attempt ${attempt + 1}/6] Query: "${query}"`);

    // Fetch candidates from all sources simultaneously
    const [pexelsPicks, unsplashPicks, wikimediaPicks, pixabayPicks] = await Promise.all([
      fetchMultipleFromPexels(query, 2, attempt),
      fetchMultipleFromUnsplash(query, 1),
      fetchFromWikimedia(query),
      fetchMultipleFromPixabay(query, 1),
    ]);

    const allCandidates = [...pexelsPicks, ...unsplashPicks, ...wikimediaPicks, ...pixabayPicks]
      .filter(p => p?.url && !usedUrls.has(p.url))
      .slice(0, 3);

    if (allCandidates.length === 0) {
      log(`  No candidates from any source`);
      await new Promise(r => setTimeout(r, 800));
      continue;
    }

    log(`  Candidates: ${allCandidates.map(c => c.source).join(', ')}`);

    // Try Pixtral vision first, fall back to Groq text-only
    let picked = await verifyWithPixtral(allCandidates, articleContext, storyType, queries[0]);
    if (!picked) {
      picked = await scoreWithGroqTextOnly(allCandidates, articleContext, queries[0]);
    }
    if (!picked) { await new Promise(r => setTimeout(r, 800)); continue; }

    const score = picked.verification?.score || 0;

    if (score > bestScore) {
      bestScore = score;
      bestPhoto = picked;
    }

    if (picked.verification?.betterQuery) {
      lastBetterQuery = picked.verification.betterQuery;
    }

    if (score >= 6) { // Accept score 6+ (Groq text-only gives 5-6, Sonnet vision gives 7-10)
      const isDiverse = await checkDiversity(picked.url, recentImageUrls);
      if (isDiverse) {
        log(`  ✅ APPROVED: ${picked.source}, score ${score}/10`);
        usedUrls.add(picked.url);
        return picked;
      } else {
        log(`  ⚠️ Too similar to recent images — trying next`);
        lastBetterQuery = null;
      }
    }

    await new Promise(r => setTimeout(r, 800));
  }

  // Use best available if score >= 5
  if (bestPhoto && bestScore >= 5) {
    log(`  ⚠️ Using best available (score ${bestScore}/10): ${bestPhoto.source}`);
    usedUrls.add(bestPhoto.url);
    return bestPhoto;
  }

  // Final fallback: return whatever we have
  if (bestPhoto) {
    log(`  ⚠️ Using low-score fallback (score ${bestScore}/10)`);
    return bestPhoto;
  }

  return null;
}

// ─── Main runner (for standalone use) ────────────────────────────────────────

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  const [articles] = await conn.execute(`
    SELECT id, title, excerpt, content, featuredImage
    FROM articles
    WHERE status = 'published'
    ORDER BY publishedAt DESC
    LIMIT 5
  `);

  log(`Processing ${articles.length} articles with Image System v3 (zero Forge)`);

  const [recentImages] = await conn.execute(
    'SELECT featuredImage FROM articles WHERE status = "published" AND featuredImage IS NOT NULL AND publishedAt > DATE_SUB(NOW(), INTERVAL 30 DAY)'
  );
  recentImages.forEach(r => { if (r.featuredImage) usedUrls.add(r.featuredImage); });
  log(`Pre-loaded ${usedUrls.size} recent image URLs (30-day dedup)`);

  const recentImageUrls = recentImages.slice(0, 3).map(r => r.featuredImage).filter(Boolean);

  let updated = 0;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    log(`\n[${i + 1}/${articles.length}] ${article.id}: ${article.title?.slice(0, 60)}`);

    const photo = await processArticle(article, recentImageUrls);

    if (photo?.url && photo.url !== article.featuredImage) {
      const updateConn = await mysql.createConnection(process.env.DATABASE_URL);
      await updateConn.execute(
        'UPDATE articles SET featuredImage = ?, imageAttribution = ?, updatedAt = NOW() WHERE id = ?',
        [photo.url, photo.attribution || null, article.id]
      );
      await updateConn.end();
      log(`  ✅ Updated [${photo.source}]: ${photo.url.slice(0, 70)}`);
      updated++;
      if (photo.url) recentImageUrls.unshift(photo.url);
      if (recentImageUrls.length > 3) recentImageUrls.pop();
    } else {
      log(`  ⚠️ No better photo found`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  await conn.end();
  log(`\n=== DONE === Updated: ${updated}/${articles.length}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
