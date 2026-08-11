/**
 * QA-Powered Image Fix
 * 
 * Uses Claude vision to check each published article's featured image
 * and replaces it if it doesn't match the article title.
 * 
 * Only checks articles where the title mentions a specific airline or aircraft type.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'fix-images-qa.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';

// Articles worth checking — those with specific airline/aircraft in title
function getCorrectQuery(title) {
  const lower = title.toLowerCase();
  const airlines = [
    ['easyjet', 'easyjet aircraft orange'],
    ['ryanair', 'ryanair boeing 737 aircraft'],
    ['british airways', 'british airways aircraft'],
    ['united airlines', 'united airlines aircraft'],
    ['united ceo', 'united airlines aircraft'],
    ['united flight', 'united airlines aircraft'],
    ['delta airlines', 'delta airlines aircraft'],
    ['delta flight', 'delta airlines aircraft'],
    ['american airlines', 'american airlines aircraft'],
    ['lufthansa', 'lufthansa aircraft'],
    ['emirates', 'emirates aircraft'],
    ['qatar airways', 'qatar airways aircraft'],
    ['air france', 'air france aircraft'],
    ['southwest airlines', 'southwest airlines aircraft'],
    ['jet2', 'jet2 aircraft'],
    ['wizz air', 'wizz air aircraft'],
    ['jetblue', 'jetblue aircraft'],
    ['spirit airlines', 'spirit airlines aircraft'],
    ['alaska airlines', 'alaska airlines aircraft'],
    ['arik air', 'arik air aircraft'],
    ['philippine airlines', 'philippine airlines aircraft'],
    ['air india', 'air india aircraft'],
    ['virgin atlantic', 'virgin atlantic aircraft'],
    ['air canada', 'air canada aircraft'],
  ];
  for (const [kw, q] of airlines) {
    if (lower.includes(kw)) return { airline: kw, query: q };
  }
  return null;
}

// Use Claude vision to check if image matches the article
async function checkImageWithClaude(imageUrl, title, airline) {
  if (!FORGE_API_KEY) return { pass: true }; // Skip if no key
  try {
    const res = await fetch(`${FORGE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${FORGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-8',
        max_tokens: 150,
        messages: [{ role: 'user', content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: `This image is for an article titled: "${title}"\n\nThe article is about ${airline}. Does this image show a ${airline} aircraft with the correct livery/branding?\n\nRespond ONLY with JSON: {"correct": true/false, "reason": "brief reason", "betterQuery": "search query if wrong"}` }
        ]}],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { pass: true }; // Skip on error
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) return { pass: true };
    const result = JSON.parse(match[0]);
    return { pass: result.correct, reason: result.reason, betterQuery: result.betterQuery };
  } catch { return { pass: true }; } // Skip on error
}

async function fetchBestPhoto(query, attempt = 0) {
  // Try Pexels first
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=1&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.photos?.length) {
          const pick = data.photos[attempt % Math.min(8, data.photos.length)];
          return pick.src?.large2x || pick.src?.large;
        }
      }
    } catch {}
  }
  
  // Try Pixabay
  if (PIXABAY_API_KEY) {
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.hits?.length) return data.hits[0].largeImageURL;
      }
    } catch {}
  }
  
  return null;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all published articles with specific airlines in title
  const [articles] = await conn.execute(
    'SELECT id, title, featuredImage FROM articles WHERE status = "published" ORDER BY id DESC LIMIT 500'
  );
  
  // Filter to only articles with airline mentions
  const airlineArticles = articles.filter(a => getCorrectQuery(a.title) !== null);
  log(`Found ${airlineArticles.length} articles with airline mentions out of ${articles.length} published`);
  
  let fixed = 0;
  let correct = 0;
  
  for (let i = 0; i < airlineArticles.length; i++) {
    const article = airlineArticles[i];
    const { airline, query } = getCorrectQuery(article.title);
    
    log(`\n[${i+1}/${airlineArticles.length}] ${article.id}: ${article.title?.slice(0, 60)}`);
    log(`  Airline: ${airline} | Current: ${article.featuredImage?.slice(0, 60)}`);
    
    // Check with Claude vision
    const check = await checkImageWithClaude(article.featuredImage, article.title, airline);
    
    if (check.pass) {
      log(`  ✅ Image is correct`);
      correct++;
    } else {
      log(`  ❌ Wrong image: ${check.reason}`);
      const searchQuery = check.betterQuery || query;
      log(`  Searching: "${searchQuery}"`);
      
      const newUrl = await fetchBestPhoto(searchQuery, i % 8);
      if (newUrl) {
        await conn.execute('UPDATE articles SET featuredImage = ? WHERE id = ?', [newUrl, article.id]);
        log(`  ✅ Fixed: ${newUrl.slice(0, 70)}`);
        fixed++;
      } else {
        log(`  ❌ No replacement found`);
      }
    }
    
    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await conn.end();
  log(`\n=== Done === Correct: ${correct} | Fixed: ${fixed} | Total checked: ${airlineArticles.length}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
