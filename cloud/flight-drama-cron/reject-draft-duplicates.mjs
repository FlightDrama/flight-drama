/**
 * Reject Duplicate Draft Articles
 * 
 * Scans all draft articles in the queue and uses Claude Opus 4.8 to find
 * semantic duplicates (same event, different headline). Rejects the older/
 * lower-quality duplicate, keeps the better one.
 * 
 * Also checks drafts against recently published articles.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

// NO FORGE/MANUS API — zero Manus credits
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

// Keyword similarity (fast pre-filter)
function titleFingerprint(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['that', 'this', 'with', 'from', 'after', 'into', 'just', 'have', 'been', 'were', 'they', 'their', 'what', 'when', 'where', 'which', 'while', 'about', 'during', 'before', 'landing', 'flight', 'plane', 'aircraft', 'pilot'].includes(w))
    .slice(0, 8).sort();
}
function titleSimilarity(a, b) {
  const fa = new Set(titleFingerprint(a));
  const fb = new Set(titleFingerprint(b));
  const intersection = [...fa].filter(w => fb.has(w)).length;
  const union = new Set([...fa, ...fb]).size;
  return union > 0 ? intersection / union : 0;
}

// Claude semantic batch check
async function claudeSemanticDedupBatch(pairs) {
  if (pairs.length === 0) return [];
  try {
    const pairList = pairs.map((p, i) =>
      `Pair ${i + 1}:\n  Story A: "${p.a}" — ${(p.summaryA || '').slice(0, 100)}\n  Story B: "${p.b}" — ${(p.summaryB || '').slice(0, 100)}`
    ).join('\n\n');

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 200,
        messages: [{ role: 'user', content: `You are a news deduplication system. For each pair of aviation news stories, determine if they are about the SAME real-world event (same incident, same flight, same crash, same date/location) — even if written with completely different headlines or angles.

${pairList}

Respond ONLY with a JSON array of booleans, one per pair (true = same event, false = different events):
[true/false, ...]` }]
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return pairs.map(() => false);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*?\]/);
    if (!match) return pairs.map(() => false);
    return JSON.parse(match[0]).map(r => Boolean(r));
  } catch (e) {
    log(`Claude batch error: ${e.message}`);
    return pairs.map(() => false);
  }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Fetch all draft articles
  const [drafts] = await conn.execute(
    'SELECT id, title, excerpt, createdAt FROM articles WHERE status = "draft" ORDER BY createdAt DESC'
  );
  log(`Found ${drafts.length} draft articles`);

  // Fetch recently published articles (last 30 days) for cross-check
  const [published] = await conn.execute(
    'SELECT id, title, excerpt FROM articles WHERE status = "published" AND publishedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) ORDER BY publishedAt DESC LIMIT 200'
  );
  log(`Checking against ${published.length} recently published articles`);

  const toReject = new Set(); // article IDs to reject
  const rejectReasons = new Map();

  // ── Step 1: Find duplicates WITHIN drafts ──────────────────────────────────
  log('\n=== Step 1: Checking drafts against each other ===');
  
  const greyZonePairs = [];
  const pairMeta = [];

  for (let i = 0; i < drafts.length; i++) {
    for (let j = i + 1; j < drafts.length; j++) {
      if (toReject.has(drafts[i].id) || toReject.has(drafts[j].id)) continue;
      const sim = titleSimilarity(drafts[i].title, drafts[j].title);
      
      // Obvious keyword duplicate
      if (sim > 0.45) {
        // Keep the newer one (higher ID), reject the older
        const keepIdx = drafts[i].id > drafts[j].id ? i : j;
        const rejectIdx = keepIdx === i ? j : i;
        toReject.add(drafts[rejectIdx].id);
        rejectReasons.set(drafts[rejectIdx].id, `Keyword duplicate of draft #${drafts[keepIdx].id}: "${drafts[keepIdx].title.slice(0, 50)}"`);
        log(`  [Keyword] Reject #${drafts[rejectIdx].id}: "${drafts[rejectIdx].title.slice(0, 50)}"`);
        log(`           Keep   #${drafts[keepIdx].id}: "${drafts[keepIdx].title.slice(0, 50)}"`);
      }
      // Grey zone — queue for Claude
      else if (sim >= 0.12) {
        greyZonePairs.push({ a: drafts[i].title, b: drafts[j].title, summaryA: drafts[i].excerpt, summaryB: drafts[j].excerpt });
        pairMeta.push({ i, j });
      }
    }
  }

  log(`\n  Keyword duplicates found: ${toReject.size}`);
  log(`  Grey-zone pairs to check with Claude: ${greyZonePairs.length}`);

  // Claude semantic check for grey-zone draft pairs
  for (let b = 0; b < greyZonePairs.length; b += 8) {
    const batch = greyZonePairs.slice(b, b + 8);
    const metaBatch = pairMeta.slice(b, b + 8);
    const results = await claudeSemanticDedupBatch(batch);
    for (let k = 0; k < results.length; k++) {
      if (results[k]) {
        const { i, j } = metaBatch[k];
        if (toReject.has(drafts[i].id) || toReject.has(drafts[j].id)) continue;
        // Keep newer (higher ID), reject older
        const keepIdx = drafts[i].id > drafts[j].id ? i : j;
        const rejectIdx = keepIdx === i ? j : i;
        toReject.add(drafts[rejectIdx].id);
        rejectReasons.set(drafts[rejectIdx].id, `Semantic duplicate of draft #${drafts[keepIdx].id}: "${drafts[keepIdx].title.slice(0, 50)}"`);
        log(`  [Semantic] Reject #${drafts[rejectIdx].id}: "${drafts[rejectIdx].title.slice(0, 50)}"`);
        log(`             Keep   #${drafts[keepIdx].id}: "${drafts[keepIdx].title.slice(0, 50)}"`);
      }
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Step 2: Check remaining drafts against published articles ─────────────
  log('\n=== Step 2: Checking drafts against recently published articles ===');

  const remainingDrafts = drafts.filter(d => !toReject.has(d.id));
  const dbGreyZonePairs = [];
  const dbPairMeta = [];

  for (const draft of remainingDrafts) {
    for (const pub of published) {
      const sim = titleSimilarity(draft.title, pub.title);
      if (sim > 0.45) {
        toReject.add(draft.id);
        rejectReasons.set(draft.id, `Keyword match with published #${pub.id}: "${pub.title.slice(0, 50)}"`);
        log(`  [Keyword/DB] Reject draft #${draft.id}: "${draft.title.slice(0, 50)}"`);
        break;
      } else if (sim >= 0.12 && !toReject.has(draft.id)) {
        dbGreyZonePairs.push({ a: draft.title, b: pub.title, summaryA: draft.excerpt, summaryB: pub.excerpt });
        dbPairMeta.push({ draftId: draft.id, pubId: pub.id, draftTitle: draft.title, pubTitle: pub.title });
        break; // One grey-zone match per draft is enough to trigger Claude check
      }
    }
  }

  log(`  Additional keyword matches vs published: ${[...toReject].length - (drafts.length - remainingDrafts.length)} new`);
  log(`  Grey-zone pairs vs published to check: ${dbGreyZonePairs.length}`);

  for (let b = 0; b < dbGreyZonePairs.length; b += 8) {
    const batch = dbGreyZonePairs.slice(b, b + 8);
    const metaBatch = dbPairMeta.slice(b, b + 8);
    const results = await claudeSemanticDedupBatch(batch);
    for (let k = 0; k < results.length; k++) {
      if (results[k] && !toReject.has(metaBatch[k].draftId)) {
        const { draftId, pubTitle, draftTitle } = metaBatch[k];
        toReject.add(draftId);
        rejectReasons.set(draftId, `Semantic match with published: "${pubTitle.slice(0, 50)}"`);
        log(`  [Semantic/DB] Reject draft #${draftId}: "${draftTitle.slice(0, 50)}"`);
        log(`                Matches published: "${pubTitle.slice(0, 50)}"`);
      }
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // ── Step 3: Apply rejections ───────────────────────────────────────────────
  log(`\n=== Step 3: Rejecting ${toReject.size} duplicate drafts ===`);

  if (toReject.size > 0) {
    const ids = [...toReject];
    // Reject in batches of 50
    for (let b = 0; b < ids.length; b += 50) {
      const batch = ids.slice(b, b + 50);
      const placeholders = batch.map(() => '?').join(',');
      await conn.execute(`UPDATE articles SET status = 'rejected', updatedAt = NOW() WHERE id IN (${placeholders})`, batch);
    }
    log(`  ✅ Rejected ${toReject.size} articles`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const [remaining] = await conn.execute('SELECT COUNT(*) as cnt FROM articles WHERE status = "draft"');
  
  log('\n=== SUMMARY ===');
  log(`Total drafts scanned: ${drafts.length}`);
  log(`Duplicates rejected: ${toReject.size}`);
  log(`Clean drafts remaining: ${remaining[0].cnt}`);
  log('\nRejection reasons:');
  for (const [id, reason] of rejectReasons) {
    log(`  #${id}: ${reason}`);
  }

  await conn.end();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
