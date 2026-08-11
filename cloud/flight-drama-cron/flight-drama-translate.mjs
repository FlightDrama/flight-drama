/**
 * Flight Drama — Bulk Article Translation
 * Uses Claude Opus via Manus Forge to translate all articles into 5 languages.
 * Idempotent: skips already-translated articles.
 * Run: node flight-drama-translate.mjs
 * Log: ~/flight-drama-cron/translation.log
 */

import mysql from 'mysql2/promise';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { appendFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, 'translation.log');

// Load env
const envPath = path.join(__dirname, '.env');
const env = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
} catch (e) {
  console.error('Could not read .env:', e.message);
  process.exit(1);
}

const GROQ_API_KEY = env.GROQ_API_KEY;
const MISTRAL_API_KEY = env.MISTRAL_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';
const DATABASE_URL = env.DATABASE_URL;

if ((!GROQ_API_KEY && !MISTRAL_API_KEY) || !DATABASE_URL) {
  console.error('Missing GROQ_API_KEY/MISTRAL_API_KEY or DATABASE_URL in .env');
  process.exit(1);
}

const LOCALES = [
  { code: 'de', name: 'German', instruction: 'Translate to German (Deutsch). Use formal German appropriate for aviation news.' },
  { code: 'es', name: 'Spanish', instruction: 'Translate to Spanish (Español). Use neutral Latin American Spanish appropriate for aviation news.' },
  { code: 'fr', name: 'French', instruction: 'Translate to French (Français). Use formal French appropriate for aviation news.' },
  { code: 'pt', name: 'Portuguese', instruction: 'Translate to Brazilian Portuguese (Português). Use formal Portuguese appropriate for aviation news.' },
  { code: 'ar', name: 'Arabic', instruction: 'Translate to Modern Standard Arabic (العربية). Use formal Arabic appropriate for aviation news. Preserve HTML tags exactly.' },
];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY || MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function translateArticle(article, locale) {
  const systemPrompt = `You are a professional aviation news translator. ${locale.instruction}

CRITICAL RULES:
1. Preserve ALL HTML tags exactly as they appear (e.g. <p>, <h2>, <strong>, <em>, <a href="...">, <blockquote>)
2. Do NOT translate proper nouns: airline names (Boeing, Airbus, Delta, Emirates, etc.), airport codes, aircraft model numbers (737, A380, etc.), people's names
3. Translate aviation terminology accurately using standard ${locale.name} aviation vocabulary
4. Maintain the same tone: engaging, factual, British aviation news style
5. Return ONLY the translated content with no additional commentary

Respond with a JSON object with these exact keys:
{
  "title": "translated title",
  "slug": "url-safe-slug-in-target-language",
  "excerpt": "translated excerpt (1-2 sentences)",
  "content": "full translated HTML content",
  "metaTitle": "SEO title in target language (50-60 chars)",
  "metaDescription": "SEO description in target language (150-160 chars)"
}`;

  const userPrompt = `Translate this aviation news article:

TITLE: ${article.title}

EXCERPT: ${article.excerpt || ''}

CONTENT:
${article.content.slice(0, 6000)}`;

  const raw = await callClaude(systemPrompt, userPrompt);
  
  // Extract JSON from response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Ensure slug is URL-safe
  if (!parsed.slug || parsed.slug.length < 3) {
    parsed.slug = slugify(parsed.title || article.slug + '-' + locale.code);
  }
  
  return parsed;
}

async function main() {
  log('=== Flight Drama Bulk Translation Starting ===');
  log(`Translating into: ${LOCALES.map(l => l.code).join(', ')}`);

  // Connect to DB
  const conn = await mysql.createConnection(DATABASE_URL);
  log('Connected to database');

  // Get all published articles
  const [articles] = await conn.execute(
    'SELECT id, title, slug, excerpt, content FROM articles WHERE content IS NOT NULL ORDER BY publishedAt DESC'
  );
  log(`Found ${articles.length} articles to translate`);

  let totalSuccess = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const article of articles) {
    for (const locale of LOCALES) {
      // Check if already translated
      const [existing] = await conn.execute(
        'SELECT id FROM article_translations WHERE articleId = ? AND locale = ?',
        [article.id, locale.code]
      );
      
      if (existing.length > 0) {
        log(`SKIP [${locale.code}] ${article.title.slice(0, 50)}`);
        totalSkipped++;
        continue;
      }

      try {
        log(`TRANSLATING [${locale.code}] ${article.title.slice(0, 60)}...`);
        
        const translated = await translateArticle(article, locale);
        
        // Make slug unique if needed
        let slug = translated.slug;
        const [slugCheck] = await conn.execute(
          'SELECT id FROM article_translations WHERE locale = ? AND slug = ?',
          [locale.code, slug]
        );
        if (slugCheck.length > 0) {
          slug = `${slug}-${article.id}`;
        }

        await conn.execute(
          `INSERT INTO article_translations 
           (articleId, locale, title, slug, excerpt, content, metaTitle, metaDescription, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
          [
            article.id,
            locale.code,
            translated.title || article.title,
            slug,
            translated.excerpt || article.excerpt || '',
            translated.content || article.content,
            translated.metaTitle || translated.title || '',
            translated.metaDescription || translated.excerpt || '',
          ]
        );

        log(`✅ [${locale.code}] ${translated.title?.slice(0, 50)}`);
        totalSuccess++;

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 1500));

      } catch (err) {
        log(`❌ [${locale.code}] ${article.title.slice(0, 50)}: ${err.message}`);
        totalErrors++;
        // Continue with next article
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  await conn.end();
  
  log('=== Translation Complete ===');
  log(`✅ Success: ${totalSuccess}`);
  log(`⏭  Skipped: ${totalSkipped}`);
  log(`❌ Errors:  ${totalErrors}`);
  log(`Total: ${totalSuccess + totalSkipped + totalErrors} / ${articles.length * LOCALES.length}`);
}

main().catch(err => {
  log(`FATAL: ${err.message}`);
  process.exit(1);
});
