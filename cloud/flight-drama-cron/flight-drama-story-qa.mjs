/**
 * Flight Drama Story Selection QA — 10-Pass Quality System
 * 
 * Runs BEFORE article generation to verify a story is worth writing.
 * 
 * Judges: Claude Opus 4.8 (×3), Manus Forge/Gemini (×3), Perplexity Sonar (×2), Mistral Large (×2)
 * 
 * Each judge evaluates:
 * 1. Is this genuinely newsworthy for a viral aviation audience?
 * 2. Does it have a clear viral angle (outrage, drama, money, danger, absurdity)?
 * 3. Is it aviation-specific (not just tangentially related)?
 * 4. Is there enough substance to write 600-900 words?
 * 5. Would Josh actually post this on @flightdrama?
 * 
 * GRACEFUL DEGRADATION: Any API failure = skip that pass silently.
 * Story approved if majority pass (>=50%) AND avg score >=6/10.
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

// NO FORGE/MANUS API — zero Manus credits
const GROQ_API_KEY = env.GROQ_API_KEY;
const PERPLEXITY_API_KEY = env.PERPLEXITY_API_KEY;
const MISTRAL_API_KEY = env.MISTRAL_API_KEY;
const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'; // Haiku: ~19x cheaper than Opus

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(path.join(__dirname, 'story-qa.log'), line + '\n'); } catch {}
}

function buildStoryQAPrompt(title, summary, sourceName) {
  return `You are a senior editor at Flight Drama, a viral aviation news brand similar to The Sun meets The Aviationist.

Evaluate whether this story is worth writing an article about.

STORY TITLE: "${title}"
SOURCE: ${sourceName || 'Unknown'}
SUMMARY: ${(summary || '').slice(0, 500)}

Score this story on these criteria:

1. VIRAL POTENTIAL — Would this make someone stop scrolling? Does it have outrage, drama, money, danger, absurdity, or a shocking fact?
2. AVIATION SPECIFICITY — Is this genuinely about aviation (airlines, aircraft, airports, pilots, passengers)? Not just tangentially related.
3. SUBSTANCE — Is there enough here to write 600-900 words? Specific facts, quotes, context?
4. AUDIENCE FIT — Would @flightdrama's audience (aviation enthusiasts, frequent flyers, people who love drama) care about this?
5. NOT GENERIC — Is this a specific, interesting story rather than a generic "airline announces new route" non-event?

Reject stories that are:
- War/military conflict (drone strikes, airstrikes) unless purely aviation safety related
- Politics (unless directly affecting aviation)
- Crime unrelated to aviation
- Sport
- Too vague or lacking specific facts
- Press releases with no drama

Respond ONLY with valid JSON (no markdown):
{
  "pass": true/false,
  "score": 1-10,
  "viralAngle": "what makes this viral, or null if none",
  "reason": "2-3 sentence explanation",
  "rejectReason": "why rejected if failed, or null"
}`;
}

async function judgeWithGroq(title, summary, sourceName, passName) {
  // Prefer Anthropic (Claude Opus) for quality
  if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'DISABLED') {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 300, messages: [{ role: 'user', content: buildStoryQAPrompt(title, summary, sourceName) }] }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        return parseResult(data.content?.[0]?.text, passName);
      }
      log(`  ${passName}: Anthropic ${res.status} — falling back to Groq`);
    } catch (e) { log(`  ${passName}: Anthropic error — falling back to Groq`); }
  }
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 300, messages: [{ role: 'user', content: buildStoryQAPrompt(title, summary, sourceName) }] }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { log(`  ${passName}: Groq ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) {
    log(`  ${passName}: Groq error — ${e.message.slice(0, 60)} — skipping`);
    return null;
  }
}

async function judgeWithPerplexity(title, summary, sourceName, passName) {
  if (!PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        max_tokens: 300,
        messages: [{ role: 'user', content: buildStoryQAPrompt(title, summary, sourceName) }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { log(`  ${passName}: Perplexity ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) {
    log(`  ${passName}: Perplexity error — ${e.message.slice(0, 60)} — skipping`);
    return null;
  }
}

async function judgeWithMistral(title, summary, sourceName, passName) {
  if (!MISTRAL_API_KEY) return null;
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        max_tokens: 300,
        messages: [{ role: 'user', content: buildStoryQAPrompt(title, summary, sourceName) }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { log(`  ${passName}: Mistral ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) {
    log(`  ${passName}: Mistral error — ${e.message.slice(0, 60)} — skipping`);
    return null;
  }
}

function parseResult(content, passName) {
  if (!content) return null;
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;
    const result = JSON.parse(jsonMatch[0]);
    log(`  ${passName}: score ${result.score}/10, pass=${result.pass} — ${(result.reason || result.rejectReason || '').slice(0, 80)}`);
    return result;
  } catch {
    return null;
  }
}

/**
 * Run 10-pass QA on a story candidate
 * Returns { approved, score, passCount, totalPasses, viralAngle, rejectReason }
 */
export async function runStoryQA(title, summary, sourceName) {
  log(`\n[StoryQA] "${title?.slice(0, 70)}"`);

  // 6-pass QA: Groq ×3 + Perplexity ×1 + Mistral ×2 (zero Manus credits)
  const passes = [
    () => judgeWithGroq(title, summary, sourceName, 'Pass 1 — Groq (viral potential)'),
    () => judgeWithGroq(title, summary, sourceName, 'Pass 2 — Groq (aviation specificity)'),
    () => judgeWithPerplexity(title, summary, sourceName, 'Pass 3 — Perplexity (substance check)'),
    () => judgeWithMistral(title, summary, sourceName, 'Pass 4 — Mistral (audience fit)'),
    () => judgeWithGroq(title, summary, sourceName, 'Pass 5 — Groq (drama check)'),
    () => judgeWithMistral(title, summary, sourceName, 'Pass 6 — Mistral (final verdict)'),
  ];

  const results = [];
  let viralAngle = null;
  let rejectReason = null;

  for (const passFn of passes) {
    const result = await passFn();
    if (result !== null) {
      results.push(result);
      if (result.viralAngle && !viralAngle) viralAngle = result.viralAngle;
      if (!result.pass && result.rejectReason && !rejectReason) rejectReason = result.rejectReason;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  if (results.length === 0) {
    log(`  [StoryQA] All APIs unavailable — approving by default`);
    return { approved: true, score: 5, passCount: 0, totalPasses: 0, viralAngle: null, rejectReason: null };
  }

  const passCount = results.filter(r => r.pass).length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 5), 0) / results.length;
  const passRate = passCount / results.length;
  const approved = passRate >= 0.5 && avgScore >= 6;

  log(`  [StoryQA] ${passCount}/${results.length} passed, avg ${avgScore.toFixed(1)}/10 → ${approved ? '✅ WORTH WRITING' : '❌ SKIP'}`);
  if (!approved && rejectReason) log(`  Reject reason: ${rejectReason}`);
  if (approved && viralAngle) log(`  Viral angle: ${viralAngle}`);

  return {
    approved,
    score: Math.round(avgScore),
    passCount,
    totalPasses: results.length,
    viralAngle: approved ? viralAngle : null,
    rejectReason: approved ? null : rejectReason,
  };
}
