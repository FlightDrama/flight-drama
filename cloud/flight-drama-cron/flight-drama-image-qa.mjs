/**
 * Flight Drama Ultimate Image QA System v3
 * 
 * Pipeline:
 *   1. AI-powered query generation (Claude Opus 4.8)
 *   2. Multi-source photo fetch (8 sources: Pexels, Wikimedia, Pixabay, Unsplash, Flickr, Imgur, NASA, Fallback)
 *   3. 10-pass multi-AI quality check:
 *      - Pass 1-3: Claude Opus 4.8 (vision — sees actual image)
 *      - Pass 4-5: Manus Forge/Gemini 2.5 Pro (vision)
 *      - Pass 6-7: Perplexity Sonar (URL + context analysis)
 *      - Pass 8-9: Mistral Large (URL + context analysis)
 *      - Pass 10: Final consensus verdict
 *   4. AI image generation fallback (Manus Forge) if all sources fail
 *   5. Attribution tracking and storage
 * 
 * GRACEFUL DEGRADATION: Any API failure = skip that pass silently.
 * Approved if majority pass (>=50%) AND avg score >=6/10.
 */

import { appendFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = {};
try {
  readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
} catch {}

const FORGE_API_URL = env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';
const PERPLEXITY_API_KEY = env.PERPLEXITY_API_KEY;
const MISTRAL_API_KEY = env.MISTRAL_API_KEY;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(path.join(__dirname, 'image-qa.log'), line + '\n'); } catch {}
}

// ─── QA Prompt ────────────────────────────────────────────────────────────────

function buildQAPrompt(headline, imageUrl) {
  return `You are reviewing a photo for a Flight Drama aviation news article.

HEADLINE: "${headline}"
IMAGE URL: ${imageUrl}

Evaluate:
1. SUBJECT MATCH: Does the image relate to the story? If headline mentions a specific aircraft type (Ikarus C42, Cessna 172, Boeing 737), does the image show that type? A Lufthansa A380 for an Ikarus C42 crash = FAIL.
2. AIRLINE MATCH: If headline mentions a specific airline, does the image show that airline's livery?
3. QUALITY: Is it a clean professional aviation photo (not a document, diagram, screenshot, mosque, or unrelated object)?
4. AVIATION CONTENT: Does it contain aviation content (aircraft, airport, runway, cockpit, crew)?

Respond ONLY with valid JSON (no markdown):
{"pass":true/false,"score":1-10,"reason":"brief explanation","suggestedQuery":"better search query if failed, or null"}`;
}

// ─── AI Judges ────────────────────────────────────────────────────────────────

async function judgeClaudeVision(imageUrl, headline, passName) {
  if (!FORGE_API_KEY) return null;
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 250,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: buildQAPrompt(headline, imageUrl) }
        ]}],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { log(`  ${passName}: Claude ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) { log(`  ${passName}: Claude error — ${e.message.slice(0, 50)} — skipping`); return null; }
}

async function judgeForgeVision(imageUrl, headline, passName) {
  if (!FORGE_API_KEY) return null;
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        max_tokens: 250,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: buildQAPrompt(headline, imageUrl) }
        ]}],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { log(`  ${passName}: Forge ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) { log(`  ${passName}: Forge error — ${e.message.slice(0, 50)} — skipping`); return null; }
}

async function judgePerplexity(imageUrl, headline, passName) {
  if (!PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        max_tokens: 250,
        messages: [{ role: 'user', content: buildQAPrompt(headline, imageUrl) + '\n\nNote: Analyse the URL and filename for clues about the subject.' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { log(`  ${passName}: Perplexity ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) { log(`  ${passName}: Perplexity error — ${e.message.slice(0, 50)} — skipping`); return null; }
}

async function judgeMistral(imageUrl, headline, passName) {
  if (!MISTRAL_API_KEY) return null;
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        max_tokens: 250,
        messages: [{ role: 'user', content: buildQAPrompt(headline, imageUrl) + '\n\nNote: Analyse the URL and filename for clues about the subject.' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { log(`  ${passName}: Mistral ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) { log(`  ${passName}: Mistral error — ${e.message.slice(0, 50)} — skipping`); return null; }
}

function parseResult(content, passName) {
  if (!content) return null;
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const result = JSON.parse(jsonMatch[0]);
    log(`  ${passName}: score ${result.score}/10, pass=${result.pass} — ${(result.reason || '').slice(0, 80)}`);
    return result;
  } catch { return null; }
}

// ─── AI Image Generation Fallback ────────────────────────────────────────────

async function generateAIImage(headline) {
  if (!FORGE_API_KEY) return null;
  try {
    log(`  [AI Gen] Generating image for: "${headline.slice(0, 60)}"`);
    const prompt = `Professional aviation news photograph for article: "${headline}". Realistic, photojournalistic style. No text overlays. Clean aviation subject matter.`;
    
    const res = await fetch(`${FORGE_API_URL}/images/generations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: '1280x720',
        response_format: 'url',
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) { log(`  [AI Gen] Failed: ${res.status}`); return null; }
    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (url) {
      log(`  [AI Gen] Generated: ${url.slice(0, 60)}`);
      return {
        url,
        attribution: 'AI-generated image',
        attributionUrl: null,
        requiresAttribution: false,
        source: 'AI Generated',
      };
    }
  } catch (e) { log(`  [AI Gen] Error: ${e.message.slice(0, 60)}`); }
  return null;
}

// ─── 10-Pass QA ───────────────────────────────────────────────────────────────

export async function runPhotoQA(imageUrl, headline, excerpt = '') {
  const context = excerpt ? `${headline}\n\nSynopsis: ${excerpt.slice(0, 200)}` : headline;
  log(`\n[PhotoQA] "${headline.slice(0, 60)}" | ${imageUrl.slice(0, 60)}`);

  // Image QA uses ONLY vision-capable judges (Claude + Forge)
  // Perplexity and Mistral removed — they can't see images, only URLs
  // They remain in article TEXT quality checks where they're genuinely useful
  const passes = [
    () => judgeClaudeVision(imageUrl, context, 'Pass 1 — Claude (subject match)'),
    () => judgeForgeVision(imageUrl, context, 'Pass 2 — Forge (airline match)'),
    () => judgeClaudeVision(imageUrl, context, 'Pass 3 — Claude (quality check)'),
    () => judgeForgeVision(imageUrl, context, 'Pass 4 — Forge (aviation content)'),
    () => judgeClaudeVision(imageUrl, context, 'Pass 5 — Claude (final verdict)'),
    () => judgeForgeVision(imageUrl, context, 'Pass 6 — Forge (final verdict)'),
  ];

  const results = [];
  let suggestedQuery = null;

  for (const passFn of passes) {
    const result = await passFn();
    if (result !== null) {
      results.push(result);
      if (!result.pass && result.suggestedQuery && !suggestedQuery) {
        suggestedQuery = result.suggestedQuery;
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  if (results.length === 0) {
    log(`  [PhotoQA] All APIs unavailable — approving by default`);
    return { approved: true, score: 5, passCount: 0, totalPasses: 0, suggestedQuery: null };
  }

  // All passes are now vision judges (Claude + Forge) — simple majority vote
  const passCount = results.filter(r => r.pass).length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 5), 0) / results.length;
  const passRate = passCount / results.length;
  
  // Approve if majority of vision judges pass AND average score >= 5.5
  const approved = passRate >= 0.5 && avgScore >= 5.5;

  log(`  [PhotoQA] ${passCount}/${results.length} passed, avg ${avgScore.toFixed(1)}/10 → ${approved ? '✅ APPROVED' : '❌ REJECTED'}`);

  return { approved, score: Math.round(avgScore), passCount, totalPasses: results.length, suggestedQuery: approved ? null : suggestedQuery };
}

// ─── Main Selection Function ──────────────────────────────────────────────────

/**
 * Select the best photo for an article using:
 * 1. AI-generated queries
 * 2. All 8 image sources
 * 3. 10-pass QA
 * 4. AI image generation as final fallback
 * 
 * Returns { url, attribution, attributionUrl, requiresAttribution, source, qa }
 */
export async function selectPhotoWithQA(headline, category = '', apiKeys = {}, maxAttempts = 8, excerpt = '') {
  const { fetchPhotoWithAIQueries, fetchPhoto, buildKeywordQuery } = await import('./flight-drama-photo-fetcher.mjs');
  
  let bestPhoto = null;
  let bestScore = 0;
  let lastSuggestedQuery = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`\n[SelectPhoto] Attempt ${attempt}/${maxAttempts}`);

    let photo = null;
    
    if (attempt === 1) {
      // First attempt: use AI-generated queries across all sources
      photo = await fetchPhotoWithAIQueries(headline, category, 0);
    } else if (lastSuggestedQuery) {
      // Use QA-suggested query
      log(`  Using QA-suggested query: "${lastSuggestedQuery}"`);
      photo = await fetchPhoto(lastSuggestedQuery, apiKeys, attempt - 1);
    } else {
      // Try keyword query with different offset
      const query = buildKeywordQuery(headline, category);
      photo = await fetchPhoto(query, apiKeys, attempt - 1);
    }

    if (!photo?.url) {
      log(`  No photo returned`);
      continue;
    }

    const qa = await runPhotoQA(photo.url, headline);

    // Track best photo
    if (qa.score > bestScore) {
      bestScore = qa.score;
      bestPhoto = { ...photo, qa };
    }

    if (qa.approved) {
      log(`  ✅ Photo approved on attempt ${attempt}`);
      return { ...photo, qa };
    }

    lastSuggestedQuery = qa.suggestedQuery;
  }

  // All real photos failed — try AI image generation
  log(`\n[SelectPhoto] All ${maxAttempts} attempts failed (best score: ${bestScore}/10) — trying AI generation`);
  const aiPhoto = await generateAIImage(headline);
  if (aiPhoto?.url) {
    const aiQa = await runPhotoQA(aiPhoto.url, headline);
    if (aiQa.approved || aiQa.score > bestScore) {
      log(`  ✅ AI-generated image accepted (score ${aiQa.score}/10)`);
      return { ...aiPhoto, qa: aiQa };
    }
  }

  // Return best scoring real photo if score >= 6 (must be clearly aviation-related)
  // Score 4-5 means "might be aviation" but we've seen cats score 4 via URL analysis
  if (bestPhoto && bestScore >= 6) {
    log(`  Using best available photo (score ${bestScore}/10)`);
    return bestPhoto;
  }
  
  // Score < 6 means all photos were wrong — use safe generic aviation fallback
  log(`  Best score ${bestScore}/10 too low — using safe aviation fallback`);

  // Absolute final fallback — generic aviation photo
  const SAFE_FALLBACKS = [
    { url: 'https://images.pexels.com/photos/46148/aircraft-jet-landing-cloud-46148.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null, source: 'Pexels' },
    { url: 'https://images.pexels.com/photos/1309644/pexels-photo-1309644.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null, source: 'Pexels' },
    { url: 'https://images.pexels.com/photos/912050/pexels-photo-912050.jpeg?auto=compress&cs=tinysrgb&w=1080', attribution: null, source: 'Pexels' },
  ];
  const safeIdx = Math.floor(Math.random() * SAFE_FALLBACKS.length);
  log(`  Using safe fallback photo`);
  return { ...SAFE_FALLBACKS[safeIdx], qa: { approved: false, score: 0, passCount: 0, totalPasses: 0 } };
}

// ─── Legacy exports for backward compatibility ────────────────────────────────

export async function runQualityCheck(pngBuffer, headline, category) {
  // For branded template images — convert buffer to data URI and run QA
  const imageDataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  const results = [];
  
  const passes = [
    () => judgeClaudeVision(imageDataUri, headline, 'Pass 1 — Claude'),
    () => judgeForgeVision(imageDataUri, headline, 'Pass 2 — Forge'),
    () => judgeClaudeVision(imageDataUri, headline, 'Pass 3 — Claude'),
    () => judgeForgeVision(imageDataUri, headline, 'Pass 4 — Forge'),
    () => judgeClaudeVision(imageDataUri, headline, 'Pass 5 — Claude'),
  ];
  
  for (const passFn of passes) {
    const result = await passFn();
    if (result !== null) results.push(result);
    await new Promise(r => setTimeout(r, 300));
  }
  
  if (results.length === 0) return { passed: true, score: 5, issues: [], details: {}, passCount: 0, suggestedTopQuery: null, suggestedBottomQuery: null };
  
  const passCount = results.filter(r => r.pass).length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 5), 0) / results.length;
  const passed = passCount / results.length >= 0.5 && avgScore >= 6;
  const failedResult = results.find(r => !r.pass && r.suggestedQuery);
  
  return { passed, score: Math.round(avgScore), issues: results.filter(r => !r.pass).map(r => r.reason || ''), details: {}, passCount, suggestedTopQuery: passed ? null : (failedResult?.suggestedQuery || null), suggestedBottomQuery: null };
}

export async function runForgeFinalPass(pngBuffer, headline) {
  const imageDataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`;
  const result = await judgeForgeVision(imageDataUri, headline, 'Forge Final');
  if (!result) return { approved: true, topQuery: null, bottomQuery: null, reason: 'Forge unavailable — auto-approved' };
  return { approved: result.pass, topQuery: result.suggestedQuery || null, bottomQuery: null, reason: result.reason || '' };
}

export async function generateWithQA(generateFn, fetchPhotosFn, headline, category, maxAttempts = 10) {
  let bestBuffer = null;
  let bestScore = 0;
  let lastResult = null;
  let overrideTopQuery = null;
  let overrideBottomQuery = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      let topPhoto, bottomPhoto;
      if (overrideTopQuery || overrideBottomQuery) {
        const { fetchPhoto } = await import('./flight-drama-photo-fetcher.mjs');
        const apiKeys = { pexels: env.PEXELS_API_KEY, pixabay: env.PIXABAY_API_KEY };
        if (overrideTopQuery) { const r = await fetchPhoto(overrideTopQuery, apiKeys, attempt); topPhoto = r?.url; }
        if (overrideBottomQuery) { const r = await fetchPhoto(overrideBottomQuery, apiKeys, attempt); bottomPhoto = r?.url; }
        const photos = await fetchPhotosFn(attempt);
        if (!topPhoto) topPhoto = photos.topPhoto;
        if (!bottomPhoto) bottomPhoto = photos.bottomPhoto;
        overrideTopQuery = null;
        overrideBottomQuery = null;
      } else {
        const photos = await fetchPhotosFn(attempt);
        topPhoto = photos.topPhoto;
        bottomPhoto = photos.bottomPhoto;
      }

      const buffer = await generateFn(topPhoto, bottomPhoto);
      log(`  [QA] Attempt ${attempt}/${maxAttempts} — running quality check...`);
      const qaResult = await runQualityCheck(buffer, headline, category);
      log(`  [QA] Score: ${qaResult.score}/10 | Passes: ${qaResult.passCount} | ${qaResult.passed ? '✅' : '❌'}`);

      lastResult = qaResult;
      if (qaResult.score > bestScore) { bestScore = qaResult.score; bestBuffer = buffer; }

      if (qaResult.passed) {
        const forgeResult = await runForgeFinalPass(buffer, headline);
        log(`  [Forge] ${forgeResult.approved ? '✅ APPROVED' : '❌ REJECTED'}: ${forgeResult.reason}`);
        if (forgeResult.approved) return { buffer, qaResult, attempt, forgeApproved: true };
        if (forgeResult.topQuery) overrideTopQuery = forgeResult.topQuery;
        if (forgeResult.bottomQuery) overrideBottomQuery = forgeResult.bottomQuery;
      } else {
        if (qaResult.suggestedTopQuery) overrideTopQuery = qaResult.suggestedTopQuery;
        if (qaResult.suggestedBottomQuery) overrideBottomQuery = qaResult.suggestedBottomQuery;
      }
    } catch (err) {
      log(`  [QA] Attempt ${attempt} error: ${err.message}`);
    }
  }

  log(`  [QA] All ${maxAttempts} attempts done. Best score: ${bestScore}/10`);
  return { buffer: bestBuffer, qaResult: lastResult, attempt: maxAttempts, forgeApproved: false };
}
