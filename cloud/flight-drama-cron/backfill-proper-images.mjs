/**
 * Flight Drama Image Backfill v4
 * 
 * Finds all articles with generic fallback images and replaces them
 * using the new 5-source photo system with AI-generated queries.
 * 
 * Sources: Pexels → Wikimedia → Pixabay → Unsplash → NASA
 * Query generation: Claude Opus 4.8 generates specific queries per headline
 * No QA passes (too slow for backfill) — just fetch the best photo per query
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'backfill-proper-images.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || 'https://api.manus.im/forge/v1';
const FORGE_API_KEY = 'DISABLED_OLD_OM_KEY';

// Generic fallback images to replace
const GENERIC_IMAGES = [
  '46148', '358220', '912050', '2026324', '1169754', '1309644', '723240',
  '1004409', '3769138', '2599537', '2898199', '1450353', '3155666', '4481259',
  '3807517', '1436139', '3764984', '2876511', '3806753', '2159549',
];

function isGenericImage(url) {
  if (!url) return true;
  return GENERIC_IMAGES.some(id => url.includes(id));
}

// Build a smart search query from headline
function buildQuery(headline) {
  const lower = headline.toLowerCase();
  
  // Airlines
  const airlines = [
    ['ryanair', 'ryanair aircraft'], ['easyjet', 'easyjet aircraft'],
    ['british airways', 'british airways aircraft'], ['united airlines', 'united airlines aircraft'],
    ['delta airlines', 'delta airlines aircraft'], ['delta air lines', 'delta airlines aircraft'],
    ['emirates', 'emirates aircraft'], ['lufthansa', 'lufthansa aircraft'],
    ['qatar airways', 'qatar airways aircraft'], ['air france', 'air france aircraft'],
    ['southwest airlines', 'southwest airlines aircraft'], ['american airlines', 'american airlines aircraft'],
    ['wizz air', 'wizz air aircraft'], ['jetblue', 'jetblue aircraft'],
    ['spirit airlines', 'spirit airlines aircraft'], ['ryanair', 'ryanair aircraft'],
    ['jet2', 'jet2 aircraft'], ['arik air', 'arik air aircraft'],
    ['philippine airlines', 'philippine airlines aircraft'],
  ];
  for (const [kw, q] of airlines) { if (lower.includes(kw)) return q; }
  
  // Aircraft types
  if (lower.includes('ikarus c42') || lower.includes('c42')) return 'ikarus c42 microlight aircraft';
  if (lower.includes('cessna 172') || lower.includes('cessna')) return 'cessna small aircraft general aviation';
  if (lower.includes('boeing 737')) return 'boeing 737 aircraft';
  if (lower.includes('boeing 717')) return 'boeing 717 aircraft';
  if (lower.includes('boeing 787')) return 'boeing 787 dreamliner';
  if (lower.includes('airbus a320')) return 'airbus a320 aircraft';
  if (lower.includes('hot air balloon')) return 'hot air balloon';
  
  // Situations
  if (lower.includes('river') || lower.includes('freezing')) return 'aircraft water emergency river';
  if (lower.includes('trees') || lower.includes('forest')) return 'small aircraft emergency landing field';
  if (lower.includes('highway') || lower.includes('road')) return 'small aircraft emergency highway';
  if (lower.includes('engine failure') || lower.includes('engine failed')) return 'aircraft engine failure emergency';
  if (lower.includes('emergency landing')) return 'aircraft emergency landing runway';
  if (lower.includes('drunk passenger') || lower.includes('disruptive passenger')) return 'airplane cabin passengers';
  if (lower.includes('cockpit') || lower.includes('pilot')) return 'airplane cockpit pilot';
  if (lower.includes('airport')) return 'international airport terminal';
  if (lower.includes('strike') || lower.includes('lawsuit') || lower.includes('suing')) return 'airline workers airport';
  if (lower.includes('salary') || lower.includes('pay') || lower.includes('overtime')) return 'pilot aircraft cockpit';
  
  return 'commercial aircraft sky';
}

// Fetch from Pexels
async function fetchPexels(query, attempt = 0) {
  if (!PEXELS_API_KEY) return null;
  try {
    const page = Math.floor(attempt / 5) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) return null;
    const pick = data.photos[attempt % Math.min(8, data.photos.length)];
    return { url: pick.src?.large2x || pick.src?.large, source: 'Pexels' };
  } catch { return null; }
}

// Fetch from Wikimedia
async function fetchWikimedia(query) {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' aircraft')}&srnamespace=6&srlimit=5&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = (data.query?.search || []).filter(r => r.title.match(/\.(jpg|jpeg|png)$/i));
    if (!results.length) return null;
    
    for (const r of results.slice(0, 3)) {
      const imgRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(r.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!imgRes.ok) continue;
      const imgData = await imgRes.json();
      const pages = Object.values(imgData.query?.pages || {});
      const url = pages[0]?.imageinfo?.[0]?.url;
      if (url && !url.endsWith('.svg')) return { url, source: 'Wikimedia' };
    }
  } catch {}
  return null;
}

// Fetch from Pixabay
async function fetchPixabay(query, attempt = 0) {
  if (!PIXABAY_API_KEY) return null;
  try {
    const page = Math.floor(attempt / 5) + 1;
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&page=${page}&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hits?.length) return null;
    const pick = data.hits[attempt % Math.min(5, data.hits.length)];
    return { url: pick.largeImageURL || pick.webformatURL, source: 'Pixabay' };
  } catch { return null; }
}

// Main: find best photo for a headline
async function findBestPhoto(headline, attempt = 0) {
  const query = buildQuery(headline);
  log(`  Query: "${query}"`);
  
  // Try all sources
  const result = 
    await fetchPexels(query, attempt) ||
    await fetchWikimedia(query) ||
    await fetchPixabay(query, attempt) ||
    await fetchPexels('commercial aircraft sky', attempt); // safe fallback
  
  return result;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Find all articles with generic fallback images
  const [articles] = await conn.execute(`
    SELECT id, title, featuredImage, status
    FROM articles
    WHERE (
      ${GENERIC_IMAGES.map(() => 'featuredImage LIKE ?').join(' OR ')}
    )
    AND status IN ('published', 'draft')
    ORDER BY id DESC
    LIMIT 200
  `, GENERIC_IMAGES.map(id => `%${id}%`));
  
  log(`Found ${articles.length} articles with generic fallback images`);
  
  let updated = 0;
  let failed = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    log(`\n[${i+1}/${articles.length}] ${article.id}: ${article.title?.slice(0, 60)}`);
    
    try {
      const photo = await findBestPhoto(article.title, i % 8);
      
      if (photo?.url && !isGenericImage(photo.url)) {
        await conn.execute(
          'UPDATE articles SET featuredImage = ?, updatedAt = NOW() WHERE id = ?',
          [photo.url, article.id]
        );
        log(`  ✅ Updated with ${photo.source}: ${photo.url.slice(0, 70)}`);
        updated++;
      } else if (photo?.url) {
        // Got a photo but it's still generic — try a different attempt
        const photo2 = await findBestPhoto(article.title, (i + 3) % 8);
        if (photo2?.url && !isGenericImage(photo2.url)) {
          await conn.execute(
            'UPDATE articles SET featuredImage = ?, updatedAt = NOW() WHERE id = ?',
            [photo2.url, article.id]
          );
          log(`  ✅ Updated (attempt 2) with ${photo2.source}: ${photo2.url.slice(0, 70)}`);
          updated++;
        } else {
          log(`  ⚠️ Only got generic image — keeping original`);
          failed++;
        }
      } else {
        log(`  ❌ No photo found`);
        failed++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (e) {
      log(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }
  
  await conn.end();
  log(`\n=== Backfill Complete ===`);
  log(`Updated: ${updated} | Failed: ${failed} | Total: ${articles.length}`);
}

main().catch(e => {
  log(`Fatal: ${e.message}`);
  process.exit(1);
});
