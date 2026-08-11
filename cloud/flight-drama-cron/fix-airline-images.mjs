/**
 * Airline-Aware Image Fix
 * 
 * Scans all published articles, detects airline mentions in titles,
 * and replaces images where the current image doesn't match the airline.
 * 
 * Uses Pexels API with airline-specific queries.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const LOG_FILE = join(__dirname, 'fix-airline-images.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(LOG_FILE, line + '\n');
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

// Airline detection: title keyword → correct Pexels search query
const AIRLINE_QUERIES = [
  { keywords: ['easyjet', 'easy jet'], query: 'easyjet aircraft orange', check: (url) => !url.includes('easyjet') },
  { keywords: ['ryanair'], query: 'ryanair boeing 737 aircraft', check: (url) => !url.includes('ryanair') },
  { keywords: ['british airways'], query: 'british airways aircraft', check: (url) => !url.includes('british') },
  { keywords: ['united airlines', 'united ceo', 'united flight'], query: 'united airlines aircraft blue', check: (url) => true },
  { keywords: ['delta airlines', 'delta flight', 'delta air'], query: 'delta airlines aircraft', check: (url) => true },
  { keywords: ['american airlines', 'american flight'], query: 'american airlines aircraft', check: (url) => true },
  { keywords: ['lufthansa'], query: 'lufthansa aircraft', check: (url) => !url.includes('lufthansa') },
  { keywords: ['emirates'], query: 'emirates aircraft', check: (url) => true },
  { keywords: ['qatar airways'], query: 'qatar airways aircraft', check: (url) => true },
  { keywords: ['air france'], query: 'air france aircraft', check: (url) => true },
  { keywords: ['southwest airlines', 'southwest flight'], query: 'southwest airlines aircraft', check: (url) => true },
  { keywords: ['jet2'], query: 'jet2 aircraft', check: (url) => true },
  { keywords: ['wizz air'], query: 'wizz air aircraft', check: (url) => true },
  { keywords: ['jetblue'], query: 'jetblue aircraft', check: (url) => true },
  { keywords: ['spirit airlines'], query: 'spirit airlines aircraft', check: (url) => true },
  { keywords: ['alaska airlines'], query: 'alaska airlines aircraft', check: (url) => true },
  { keywords: ['qantas'], query: 'qantas aircraft', check: (url) => true },
  { keywords: ['singapore airlines'], query: 'singapore airlines aircraft', check: (url) => true },
  { keywords: ['turkish airlines'], query: 'turkish airlines aircraft', check: (url) => true },
  { keywords: ['air india'], query: 'air india aircraft', check: (url) => true },
  { keywords: ['arik air'], query: 'arik air aircraft nigeria', check: (url) => true },
  { keywords: ['philippine airlines'], query: 'philippine airlines aircraft', check: (url) => true },
  { keywords: ['klm'], query: 'klm aircraft', check: (url) => true },
  { keywords: ['iberia'], query: 'iberia aircraft', check: (url) => true },
  { keywords: ['air canada'], query: 'air canada aircraft', check: (url) => true },
  { keywords: ['virgin atlantic'], query: 'virgin atlantic aircraft', check: (url) => true },
  { keywords: ['norwegian'], query: 'norwegian air aircraft', check: (url) => true },
  { keywords: ['transavia'], query: 'transavia aircraft', check: (url) => true },
];

// Detect if an image URL is a wrong airline (e.g. Lufthansa for an easyJet story)
function detectWrongAirline(title, imageUrl) {
  const lower = title.toLowerCase();
  const imgLower = (imageUrl || '').toLowerCase();
  
  for (const airline of AIRLINE_QUERIES) {
    const titleMentions = airline.keywords.some(kw => lower.includes(kw));
    if (!titleMentions) continue;
    
    // Check if image is from a DIFFERENT airline
    const wrongAirlines = AIRLINE_QUERIES.filter(a => 
      a.keywords[0] !== airline.keywords[0] && 
      a.keywords.some(kw => imgLower.includes(kw))
    );
    
    if (wrongAirlines.length > 0) {
      return { correct: airline, wrong: wrongAirlines[0] };
    }
    
    // Also check if it's a generic image that should be airline-specific
    return { correct: airline, wrong: null };
  }
  return null;
}

async function fetchPexels(query, attempt = 0) {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) return null;
    const pick = data.photos[attempt % Math.min(8, data.photos.length)];
    return pick.src?.large2x || pick.src?.large;
  } catch { return null; }
}

async function fetchPixabay(query) {
  if (!PIXABAY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.hits?.length) return null;
    return data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))].largeImageURL;
  } catch { return null; }
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get all published articles
  const [articles] = await conn.execute(
    'SELECT id, title, featuredImage FROM articles WHERE status = "published" ORDER BY id DESC LIMIT 500'
  );
  
  log(`Checking ${articles.length} published articles for wrong airline images...`);
  
  let fixed = 0;
  let checked = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const detection = detectWrongAirline(article.title, article.featuredImage);
    
    if (!detection) continue; // No airline in title
    checked++;
    
    const { correct, wrong } = detection;
    
    if (wrong) {
      log(`\n[${i+1}] WRONG AIRLINE: "${article.title?.slice(0, 60)}"`);
      log(`  Has: ${wrong.keywords[0]} | Should be: ${correct.keywords[0]}`);
    } else {
      // Has airline in title but image might be generic — only fix if it's clearly wrong
      // Check if current image is from a different airline
      const currentImgLower = (article.featuredImage || '').toLowerCase();
      const isWrongAirline = AIRLINE_QUERIES.some(a => 
        !correct.keywords.some(kw => a.keywords.includes(kw)) && 
        a.keywords.some(kw => currentImgLower.includes(kw))
      );
      
      if (!isWrongAirline) continue; // Image is generic or correct, skip
      
      log(`\n[${i+1}] GENERIC/WRONG: "${article.title?.slice(0, 60)}"`);
      log(`  Should be: ${correct.keywords[0]}`);
    }
    
    // Fetch correct airline image
    const newUrl = await fetchPexels(correct.query, i % 8) || await fetchPixabay(correct.query);
    
    if (newUrl) {
      await conn.execute('UPDATE articles SET featuredImage = ? WHERE id = ?', [newUrl, article.id]);
      log(`  ✅ Fixed: ${newUrl.slice(0, 70)}`);
      fixed++;
    } else {
      log(`  ❌ No photo found for: ${correct.query}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  await conn.end();
  log(`\n=== Done === Checked: ${checked} | Fixed: ${fixed}`);
}

main().catch(e => { log(`Fatal: ${e.message}`); process.exit(1); });
