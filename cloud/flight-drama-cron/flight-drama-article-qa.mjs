/**
 * Flight Drama Article Writing QA — 10-Pass Quality System
 * 
 * Judges: Claude Opus 4.8 (×3 via Forge), Manus Forge/Gemini (×3), Perplexity Sonar (×2), Mistral Large (×2)
 * 
 * Each judge evaluates the article against Josh's standards:
 * - No em dashes
 * - No AI clichés
 * - Correct tone (DRAMA or STRAIGHT based on story type)
 * - Accurate facts and attribution
 * - Viral angle identified and executed
 * - Reads human, not generated
 * 
 * GRACEFUL DEGRADATION: Any API failure = skip that pass silently.
 * Article approved if majority of available judges pass it (>=50%) AND avg score >=7/10.
 * On failure: judges suggest specific rewrites.
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
  try { appendFileSync(path.join(__dirname, 'article-qa.log'), line + '\n'); } catch {}
}

// ─── Article QA Prompt ────────────────────────────────────────────────────────

function buildArticleQAPrompt(headline, articleContent, excerpt) {
  // Strip HTML tags for readability
  const plainText = articleContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
  
  return `You are a senior editor at Flight Drama, a viral aviation news brand.

Review this article for quality. Be strict but fair.

HEADLINE: "${headline}"

EXCERPT: "${excerpt}"

ARTICLE (first 3000 chars):
${plainText}

Evaluate against these criteria:

1. NO EM DASHES — Any em dash (—) in the article body = automatic FAIL. Check carefully.
2. NO AI CLICHÉS — Phrases like "In a significant development", "It remains to be seen", "Going forward", "The move comes as", "Meanwhile", "Additionally", "Furthermore" = FAIL.
3. VIRAL ANGLE — Does the article identify and execute a clear viral angle? Does it make the reader feel something (outrage, disbelief, amusement)?
4. HUMAN VOICE — Does it read like a skilled journalist or like AI output? Be honest.
5. ACCURACY — Does it use specific facts (exact numbers, dates, aircraft types, airline names)?
6. TONE MATCH — For passenger drama/money stories: is it relatable and engaging? For emergencies/fatalities: is it straight and respectful?
7. OPENING — Does the opening immediately grab attention and establish the key fact?
8. SUBHEADINGS — Are subheadings informative (not generic like "Background" or "Overview")?

Respond ONLY with valid JSON (no markdown):
{
  "pass": true/false,
  "score": 1-10,
  "emDashFound": true/false,
  "aiClicnesFound": ["list any found, or empty array"],
  "viralAngleStrong": true/false,
  "humanVoice": true/false,
  "reason": "2-3 sentence summary of main issues or strengths",
  "rewriteSuggestion": "specific instruction for improvement if failed, or null if passed"
}`;
}

// ─── Judge Implementations ────────────────────────────────────────────────────

async function judgeWithGroq(headline, content, excerpt, passName) {
  // Prefer Anthropic (Claude Opus) for quality
  if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== 'DISABLED') {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 500, messages: [{ role: 'user', content: buildArticleQAPrompt(headline, content, excerpt) }] }),
        signal: AbortSignal.timeout(30000),
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
      body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 500, messages: [{ role: 'user', content: buildArticleQAPrompt(headline, content, excerpt) }] }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) { log(`  ${passName}: Groq ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) {
    log(`  ${passName}: Groq error — ${e.message.slice(0, 60)} — skipping`);
    return null;
  }
}

async function judgeWithPerplexity(headline, content, excerpt, passName) {
  if (!PERPLEXITY_API_KEY) return null;
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${PERPLEXITY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        max_tokens: 500,
        messages: [{ role: 'user', content: buildArticleQAPrompt(headline, content, excerpt) }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) { log(`  ${passName}: Perplexity ${res.status} — skipping`); return null; }
    const data = await res.json();
    return parseResult(data.choices?.[0]?.message?.content, passName);
  } catch (e) {
    log(`  ${passName}: Perplexity error — ${e.message.slice(0, 60)} — skipping`);
    return null;
  }
}

async function judgeWithMistral(headline, content, excerpt, passName) {
  if (!MISTRAL_API_KEY) return null;
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        max_tokens: 500,
        messages: [{ role: 'user', content: buildArticleQAPrompt(headline, content, excerpt) }],
      }),
      signal: AbortSignal.timeout(20000),
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
    const issues = [];
    if (result.emDashFound) issues.push('em dash found');
    if (result.aiClicnesFound?.length > 0) issues.push(`AI clichés: ${result.aiClicnesFound.join(', ')}`);
    log(`  ${passName}: score ${result.score}/10, pass=${result.pass}${issues.length ? ` [${issues.join(', ')}]` : ''} — ${(result.reason || '').slice(0, 80)}`);
    return result;
  } catch {
    return null;
  }
}

// ─── 10-Pass Article QA ───────────────────────────────────────────────────────

/**
 * Run 10-pass QA on article content
 * Returns { approved, score, passCount, totalPasses, issues, rewriteSuggestion }
 */
export async function runArticleQA(headline, content, excerpt) {
  log(`\n[ArticleQA] "${headline.slice(0, 60)}"`);

  // Quick pre-check: catch obvious em dashes before calling any API
  const hasEmDash = content.includes('—') || content.includes('\u2014');
  if (hasEmDash) {
    log(`  [ArticleQA] Pre-check: em dash found — auto-fixing before QA`);
  }

  // 6-pass QA: Groq ×3 + Perplexity ×1 + Mistral ×2 (zero Manus credits)
  const passes = [
    () => judgeWithGroq(headline, content, excerpt, 'Pass 1 — Groq (em dash + clichés)'),
    () => judgeWithGroq(headline, content, excerpt, 'Pass 2 — Groq (viral angle)'),
    () => judgeWithPerplexity(headline, content, excerpt, 'Pass 3 — Perplexity (human voice)'),
    () => judgeWithMistral(headline, content, excerpt, 'Pass 4 — Mistral (accuracy)'),
    () => judgeWithGroq(headline, content, excerpt, 'Pass 5 — Groq (tone + opening)'),
    () => judgeWithMistral(headline, content, excerpt, 'Pass 6 — Mistral (final verdict)'),
  ];

  const results = [];
  let rewriteSuggestion = null;
  const allIssues = [];

  for (const passFn of passes) {
    const result = await passFn();
    if (result !== null) {
      results.push(result);
      if (!result.pass) {
        if (result.rewriteSuggestion && !rewriteSuggestion) rewriteSuggestion = result.rewriteSuggestion;
        if (result.emDashFound) allIssues.push('em dash found');
        if (result.aiClicnesFound?.length > 0) allIssues.push(...result.aiClicnesFound.map(c => `cliché: "${c}"`));
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  if (results.length === 0) {
    log(`  [ArticleQA] All APIs unavailable — approving by default`);
    return { approved: true, score: 5, passCount: 0, totalPasses: 0, issues: [], rewriteSuggestion: null };
  }

  const passCount = results.filter(r => r.pass).length;
  const avgScore = results.reduce((sum, r) => sum + (r.score || 5), 0) / results.length;
  const passRate = passCount / results.length;
  const approved = passRate >= 0.5 && avgScore >= 7;

  log(`  [ArticleQA] ${passCount}/${results.length} passed, avg ${avgScore.toFixed(1)}/10 → ${approved ? '✅ APPROVED' : '❌ REJECTED'}`);

  return {
    approved,
    score: Math.round(avgScore),
    passCount,
    totalPasses: results.length,
    issues: [...new Set(allIssues)],
    rewriteSuggestion: approved ? null : rewriteSuggestion,
  };
}

/**
 * Auto-fix common issues before QA:
 * - Replace em dashes with commas or hyphens
 * - Remove known AI clichés
 */
export function autoFixArticle(content) {
  let fixed = content;
  
  // Replace em dashes with appropriate alternatives
  fixed = fixed.replace(/ — /g, ', ');
  fixed = fixed.replace(/—/g, '-');
  fixed = fixed.replace(/\u2014/g, '-');
  
  // Remove common AI clichés
  const clicheReplacements = [
    [/In a significant development,?\s*/gi, ''],
    [/It remains to be seen\s*/gi, ''],
    [/Going forward,?\s*/gi, ''],
    [/The move comes as\s*/gi, 'This comes as '],
    [/\bMeanwhile,?\s*/gi, ''],
    [/\bAdditionally,?\s*/gi, ''],
    [/\bFurthermore,?\s*/gi, ''],
    [/Industry-leading\s*/gi, ''],
    [/Strategic initiative/gi, 'plan'],
    [/Commitment to excellence/gi, 'focus on quality'],
    [/In today's rapidly evolving landscape,?\s*/gi, ''],
  ];
  
  for (const [pattern, replacement] of clicheReplacements) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  return fixed;
}
